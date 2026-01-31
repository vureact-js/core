import { normalizePath } from '@src/shared/path';
import fs from 'fs';
import kleur from 'kleur';
import path from 'path';
import { BaseCompiler } from './base-compiler';
import {
  AssetCache,
  CacheFilename,
  CacheNode,
  CompilationUnit,
  CompileCache,
  CompileCacheNode,
  CompilerOptions,
} from './types';

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
    // eslint-disable-next-line no-console
    console.info('\n\n', kleur.bold(kleur.magenta(`    VuReact v${this.version}`)), '\n\n');

    const start = performance.now();

    // 1. Vue文件处理管线
    await this.corePipeline();

    // 2. 资源处理管线 (所有非 vue 文件)
    await this.assetPipeline();

    // 3. 执行成功回调
    await this.options.onSuccess?.();

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
    const absFiles = new Set(files.map((f) => this.getAbsPath(f)));

    // 加载一次缓存供批量对比
    const cache = (await this.loadCache(CacheFilename.COMPILE)) || { cached: [] };

    await this.cleanupDeletedOutput(CacheFilename.COMPILE, (c) => !absFiles.has(c.file));
    await Promise.all(files.map(async (f) => this.processSingleFile(f, cache)));
  }

  /**
   * Process a single Vue file (this method is called directly in CLI Watch mode)
   * @param filePath Absolute path
   * @param existingCache Optional preloaded cache object
   */
  async processSingleFile(filePath: string, existingCache?: CompileCache) {
    const start = performance.now();
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

    // 计算编译耗时
    const end = performance.now();
    const duration = this.formattDuration(end - start);

    // 输出编译信息
    this.print(
      kleur.green('Compiled'),
      kleur.cyan(normalizePath(this.relativePath(unit.file))),
      kleur.magenta(`(${duration})`),
    );
  }

  /**
   * 核心逻辑：执行真正的编译逻辑（Vue -> React）
   * 将 source 转换为 output
   */
  private async processCompilationUnit(unit: CompilationUnit): Promise<CompilationUnit> {
    try {
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
    delete (cleanUnit as any).output.jsx.code;
    delete (cleanUnit as any).output.css.code;

    const index = cache.cached.findIndex((c) => c.file === unit.file);

    // 更新缓存单元
    if (index > -1) {
      cache.cached[index] = cleanUnit;
    } else {
      cache.cached.push(cleanUnit);
    }

    await this.saveCache(CacheFilename.COMPILE, cache);
  }

  /**
   * 拷贝源项目 src 中所包含的其他附属文件资源（非 .vue 文件）
   */
  private async assetPipeline() {
    const inputPath = this.getInputPath();
    const assetFiles = this.scanFiles(inputPath, (p) => !p.endsWith('.vue'));
    const absFiles = new Set(assetFiles.map((f) => this.getAbsPath(f)));

    // 加载资产缓存
    const cachePath = this.getCacheFilePath(CacheFilename.ASSET);
    const cache: AssetCache = (await this.loadCache(CacheFilename.ASSET)) || { cached: [] };

    // 清理缓存中已删除的资产及其输出文件
    await this.cleanupDeletedOutput(CacheFilename.ASSET, (u) => !absFiles.has(u.file));

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

  /**
   * Process single asset file, compare with cache and decide whether to copy.
   */
  async processSingleAsset(filePath: string, existingCache?: AssetCache) {
    const absPath = this.getAbsPath(filePath);
    const currentMeta: AssetCache['cached'][0] = {
      file: absPath,
      ...(await this.getFileMeta(absPath)),
    };

    const currentCache: AssetCache = existingCache ||
      (await this.loadCache(CacheFilename.ASSET)) || { cached: [] };

    // 查找缓存记录
    const cached = currentCache.cached?.find((f) => f.file === absPath);

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

  /**
   * Atomic/Batch cleanup:
   * Delete the build artifacts and cache corresponding to the specified path.
   *
   * @param targetPath The path of the source code (file or folder)
   * @param {CacheFilename} type The type of cleanup
   */
  async removeOutputPath(targetPath: string, type: CacheFilename) {
    const absPath = this.getAbsPath(targetPath);
    await this.cleanupDeletedOutput(
      type,
      (u) =>
        u.file === absPath ||
        // 加 path.sep 是因为假如删除了 src/components 文件夹，
        // 为了防止误删名为 src/components-old 的文件夹，
        // 所以必须确保路径后跟着一个分隔符，确保精准匹配子目录内容。
        u.file.startsWith(absPath + path.sep),
    );
  }

  /**
   * Delete the build artifacts or asset files and cache corresponding to the specified path.
   */

  private async cleanupDeletedOutput(type: CacheFilename, filter: (c: CacheNode) => boolean) {
    const cache = await this.loadCache(type as any);
    if (!cache?.cached.length) return;

    // 查找匹配条目：路径完全相等，或者是该路径下的子文件
    const toRemove: CacheNode[] = cache.cached.filter(filter);
    if (!toRemove.length) return;

    const onRemove = async (c: CacheNode) => {
      if (type === CacheFilename.COMPILE) {
        const node = c as CompileCacheNode;
        if (!node?.output) return;

        const { jsx, css } = node.output;

        // 删除 JSX
        this.removeOutputFile(jsx.file);

        // 删除 CSS
        if (css?.file) {
          this.removeOutputFile(css.file);
        }
      } else if (type === CacheFilename.ASSET) {
        // 删除附属资产
        this.removeOutputFile(c.file, true);
      }
    };

    await Promise.all(toRemove.map(onRemove));
    await this.saveCache(type, cache);
  }
}
