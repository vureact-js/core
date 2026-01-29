import { normalizePath } from '@src/shared/path';
import fs from 'fs';
import kleur from 'kleur';
import path from 'path';
import { BaseCompiler } from './base-compiler';
import { AssetCache, CacheFilename, CompilationUnit, CompileCache, CompilerOptions } from './types';

/**
 * Compiler with file system processing capability
 *
 * @extends BaseCompiler
 */
export class FileCompiler extends BaseCompiler {
  private skippedCount = 0;

  constructor(options: CompilerOptions = {}) {
    super(options);
  }

  /**
   * Execute the initial full build.
   */
  async execute() {
    const start = performance.now();

    // 1. Vue文件处理管线
    await this.corePipeline();

    // 2. 资源处理管线 (所有非 vue 文件)
    await this.assetPipeline();

    const end = performance.now();

    if (this.skippedCount) {
      this.print(kleur.green('✓'), kleur.gray(`Skipped ${this.skippedCount} unchanged file(s)`));
      this.skippedCount = 0;
    }

    this.print(kleur.green(`Done in ${this.formattDuration(end - start)}.`));
  }

  /**
   * 编译核心：负责“检查 -> 编译 -> 写入 -> 记录”的完整生命周期
   */
  private async corePipeline() {
    const inputPath = this.getInputPath();
    const files = this.scanFiles(inputPath, (p) => p.endsWith('.vue'));

    // 加载一次缓存供批量对比
    const cache = (await this.loadCache(CacheFilename.COMPILE)) || { cached: [] };

    this.processCompileCache(files, cache);

    for (const file of files) {
      await this.processSingleFile(file, cache);
    }
  }

  private async processCompileCache(files: string[], cache: CompileCache) {
    const absFiles = files.map((f) => this.getAbsPath(f));
    const removed = cache.cached.filter((c) => !absFiles.includes(c.file));
    const cachePath = this.getCacheFilePath(CacheFilename.COMPILE);

    // 检查缓存中是否存在已被删除的源文件，若存在则清理对应输出并从缓存中移除
    for (const entry of removed) {
      const { file, fileId } = entry;

      try {
        // 可能的 JSX/TSX/CSS 输出
        const jsxFiles = ['jsx', 'tsx'];
        const cssFiles = ['css', 'less', 'sass', 'scss'];
        const cssModuleFiles = cssFiles.map((e) => `module.${e}`);

        const p1: Promise<void>[] = jsxFiles.map(async (ext) => {
          await this.removeDeletedOutput(this.resolveOutputPath(file, ext));
        });

        const p2: Promise<void>[] = [...cssFiles, ...cssModuleFiles].map(async (ext) => {
          const sourceBNs = path.basename(file);
          const sourceNs = sourceBNs.split('.')[0]!.toLowerCase();

          const targetBNs = `${sourceNs}-${fileId}.${ext}`;
          const out = file.replace(sourceBNs, targetBNs);

          await this.removeDeletedOutput(this.resolveOutputPath(out));
        });

        await Promise.all([...p1, ...p2]);
      } catch (e) {
        this.print(kleur.yellow('Failed to remove output'));
        console.warn(e);
      }
    }

    // 从缓存中移除已删除的条目并写回缓存文件
    const remaining = cache.cached.filter((c) => absFiles.includes(c.file));
    const newCache = { cached: remaining } as typeof cache;

    await this.writeFileWithDir(cachePath, JSON.stringify(newCache));
  }

  /**
   * Process a single Vue file (this method is called directly in CLI Watch mode)
   * @param filePath Absolute path
   * @param existingCache Optional preloaded cache object
   */
  async processSingleFile(filePath: string, existingCache: CompileCache) {
    const absPath = this.getAbsPath(filePath);

    // 1. 获取最新元数据
    const currentMeta = await this.getFileMeta(absPath);

    // 2. 校验缓存
    const cache: CompileCache = existingCache || (await this.loadCache(CacheFilename.COMPILE));

    const cachedEntry = cache?.cached.find((c) => c.file === absPath);

    const { shouldCompile, hash } = await this.checkCacheStatus(currentMeta, cachedEntry, () =>
      fs.promises.readFile(absPath, 'utf-8'),
    );

    if (!shouldCompile) {
      this.skippedCount++;
      return;
    }

    // 3. 编译
    const source = await fs.promises.readFile(absPath, 'utf-8');
    const unit: CompilationUnit = {
      ...currentMeta,
      file: absPath,
      fileId: '',
      source,
      hash: hash || this.genHash(source),
      output: null,
    };

    // 4. 执行流水线
    const processed = await this.processCompilationUnit(unit);

    // 5. 产物落地与缓存同步
    if (processed?.output) {
      await this.writeCompilationUnit(processed);
      await this.updateCacheEntry(processed);
    }
  }

  /**
   * 核心逻辑：执行真正的编译逻辑（Vue -> React）
   * 将 source 转换为 output
   */
  private async processCompilationUnit(unit: CompilationUnit): Promise<CompilationUnit> {
    try {
      const start = performance.now();

      // 调用 BaseCompiler 的 compile 方法
      const compileResult = this.compile(unit.source, unit.file);

      // 格式化生成的代码 (Helper 类中提供的方法)
      const formattedCode = await this.formatCode(compileResult);

      const { jsx, css } = compileResult.fileInfo;

      if (css.file) {
        css.file = this.resolveOutputPath(css.file);
      }

      // 存储文件id
      unit.fileId = compileResult.fileId;

      // 存储输出结果
      unit.output = {
        jsx: {
          file: jsx.file,
          code: formattedCode,
        },
        css,
      };

      // 计算单个编译耗时
      const end = performance.now();
      const duration = this.formattDuration(end - start);

      // 输出编译信息
      this.print(
        kleur.green('Compiled'),
        kleur.cyan(normalizePath(this.relativePath(unit.file))),
        kleur.magenta(`(${duration})`),
      );
    } catch (err) {
      this.print(kleur.red(`✖ Failed to compile ${this.relativePath(unit.file)}`));
      console.error(err);
    }

    return unit;
  }

  /**
   * 将编译产物写入磁盘
   */
  private async writeCompilationUnit(unit: CompilationUnit) {
    if (!unit.output) return;

    const { jsx, css } = unit.output;

    // 1. 写入 JSX/TSX 文件
    await this.writeFileWithDir(jsx.file, jsx.code);

    // 2. 如果有样式产物，写入 CSS 文件
    if (css.file && css.code) {
      await this.writeFileWithDir(css.file, css.code);
    }
  }

  /**
   * 增量更新缓存记录
   */
  private async updateCacheEntry(unit: CompilationUnit) {
    const cache: CompileCache = (await this.loadCache(CacheFilename.COMPILE)) || { cached: [] };

    // 移除旧条目，添加新条目
    const cleanUnit = { ...unit };

    // 缓存不存源码和输出内容
    delete (cleanUnit as any).source;
    delete (cleanUnit as any).output;

    const index = cache.cached.findIndex((c) => c.file === unit.file);

    // 更新缓存单元
    if (index > -1) {
      cache.cached[index] = cleanUnit;
    } else {
      cache.cached.push(cleanUnit);
    }

    await this.writeFileWithDir(
      this.getCacheFilePath(CacheFilename.COMPILE),
      JSON.stringify(cache),
    );
  }

  /**
   * 拷贝源项目 src 中所包含的其他附属文件资源（非 .vue 文件）
   */
  private async assetPipeline() {
    const inputPath = this.getInputPath();
    const assetFiles = this.scanFiles(inputPath, (p) => !p.endsWith('.vue'));

    // 加载资产缓存
    const cachePath = this.getCacheFilePath(CacheFilename.ASSET);
    const cache: AssetCache = (await this.loadCache(CacheFilename.ASSET)) || { cached: [] };

    // 清理缓存中已删除的资产及其输出文件
    await this.cleanUpInvalidAssets(assetFiles, cache);

    // @ts-ignore
    const updatedAssetList: AssetCache['cached'] = [];

    for (const filePath of assetFiles) {
      const assetMeta = await this.processSingleAsset(filePath, cache);
      if (assetMeta) {
        updatedAssetList.push(assetMeta);
      }
    }

    // 保存资产缓存，以便下次增量处理
    const cacheData: AssetCache = { cached: updatedAssetList };

    await this.writeFileWithDir(cachePath, JSON.stringify(cacheData));
  }

  private async cleanUpInvalidAssets(files: string[], cache: AssetCache) {
    const absAssets = files.map((f) => this.getAbsPath(f));
    const removedAssets = cache.cached?.filter((c) => !absAssets.includes(c.path)) || [];

    const promises = removedAssets.map(async (asset) => {
      const out = this.resolveOutputPath(asset.path);
      await this.removeDeletedOutput(out);
    });

    try {
      await Promise.all(promises);
    } catch (e) {
      this.print(kleur.yellow('Failed to remove asset output'));
      console.warn(e);
    }
  }

  /**
   * Process single asset file, compare with cache and decide whether to copy.
   */
  async processSingleAsset(filePath: string, cache: AssetCache) {
    const absPath = this.getAbsPath(filePath);
    const currentMeta: AssetCache['cached'][0] = {
      path: absPath,
      ...(await this.getFileMeta(absPath)),
    };

    // 查找缓存记录
    const cached = cache.cached?.find((f) => f.path === absPath);

    // 如果元数据（大小、时间）未变，跳过拷贝
    if (cached && this.compareFileMeta(cached, currentMeta)) {
      return currentMeta;
    }

    // 计算输出路径并执行拷贝
    const outputPath = this.resolveOutputPath(absPath);

    await fs.promises.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.promises.copyFile(absPath, outputPath);

    this.print(kleur.blue('Copied Asset'), kleur.cyan(normalizePath(this.relativePath(absPath))));

    return currentMeta;
  }

  private async removeDeletedOutput(filePath: string) {
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
      this.print(kleur.yellow('Removed'), kleur.cyan(normalizePath(this.relativePath(filePath))));
    }
  }
}
