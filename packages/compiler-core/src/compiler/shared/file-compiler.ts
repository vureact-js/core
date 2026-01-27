import { normalizePath } from '@src/shared/path';
import { genHashByXXH } from '@src/utils/hash';
import fs from 'fs';
import kleur from 'kleur';
import path from 'path';
import { BaseCompiler } from './base-compiler';
import { AssetCache, CompilationUnit, CompileCache, CompilerOptions } from './types';

/**
 * Batch-compile `.vue` files to `.jsx` or `.tsx` files,
 * output corresponding files and directory structure to the designated path.
 */
export class FileCompiler extends BaseCompiler {
  private compilationUnits: CompilationUnit[] = [];

  // 本次 run() 发现的所有 .vue 文件列表，用于清理已删除的缓存/输出文件
  private discoveredVueFiles: string[] = [];

  // 主文件以外的附属资源文件
  private assetFiles: AssetCache['assetFiles'] = [];

  constructor(options: CompilerOptions = {}) {
    super(options);
  }

  /**
   * Run the batch compilation process.
   */
  async run() {
    // eslint-disable-next-line no-console
    console.info(kleur.bold(kleur.magenta(`\n   VuReact v${this.version}\n\n`)));
    this.print('Compiling...');

    const start = performance.now();

    await this.corePipeline();
    await this.assetPipeline();

    this.skippedFilesCount();
    this.clear();

    // 计算总耗时
    const duration = this.formattDuration(performance.now() - start);

    this.print(`${kleur.gray('Total time in')} ${duration}.`);
  }

  /**
   * 核心管线，主处理 Vue 文件
   */
  private async corePipeline() {
    const { cacheDirectory = true } = this.options;

    // 1. 读取所有 .vue 文件
    await this.readVueFiles(this.getInputPath());

    // 2.记录本次发现的所有源文件
    this.discoveredVueFiles = this.compilationUnits.map((u) => u.file);

    if (!this.compilationUnits.length) {
      this.print(kleur.yellow('No .vue files found'));
      return;
    }

    // 3.缓存对比
    await this.filterByCache();

    // 4.并行编译所有 .vue 文件
    await this.compileVueFiles();

    // 5.并行写入 react 文件
    await this.writeReactFiles();

    // 6.清理已不存在的输出文件
    await this.patchDeletedOutputs();

    // 7.编译结果写入文件缓存
    if (cacheDirectory) {
      await this.writeCompileCache();
    }
  }

  private async readVueFiles(inputPath: string) {
    // 判断输入路径类型
    let stats: fs.Stats;

    try {
      stats = await fs.promises.stat(inputPath);
    } catch (e) {
      this.print(kleur.red(`The input path ${inputPath} does not exist or is not accessible`));
      console.error('\n', e, '\n');
      return;
    }

    const { input } = this.options;

    // 单个文件
    if (stats.isFile()) {
      if (inputPath.endsWith('.vue')) {
        const source = await fs.promises.readFile(inputPath, 'utf-8');
        this.compilationUnits.push({
          file: inputPath,
          source,
          output: null,
          fileSize: stats.size,
          mtime: stats.mtimeMs,
        });
      }
    } else if (stats.isDirectory()) {
      // 目录 - 递归查找所有 .vue 文件
      await this.collectVueFilesFromDir(inputPath);
    } else {
      this.print(
        kleur.red(`The input path ${input} does not exist or is not a valid file/directory`),
      );
    }
  }

  /**
   * 从目录递归收集所有 .vue 文件
   */
  private async collectVueFilesFromDir(dirPath: string) {
    const { recursive = true } = this.options;
    const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });

    // 并行读取 .vue 文件
    const readPromises = entries.map(async (entry) => {
      const fullPath = path.join(dirPath, entry.name);

      // 跳过不需要的目录
      if (this.shouldSkipPath(fullPath)) {
        return;
      }

      if (recursive && entry.isDirectory()) {
        // 递归处理子目录
        await this.collectVueFilesFromDir(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.vue')) {
        await this.readVueFiles(fullPath);
      }
    });

    await Promise.all(readPromises);
  }

  /**
   * 通过缓存对比，过滤出需要重新编译的文件
   */
  private async filterByCache() {
    try {
      // 读取缓存文件
      const cacheFilePath = this.getCompileCachePath();

      if (!fs.existsSync(cacheFilePath)) {
        // 无旧缓存，所有文件都需编译
        return;
      }

      const content = await fs.promises.readFile(cacheFilePath, 'utf-8');
      const cache = JSON.parse(content) as CompileCache;

      // 将缓存转换为Map以便快速查找（以文件路径为键）
      const cacheMap = new Map(cache.compileRes.map((unit) => [unit.file, unit]));

      const unitsToCompile: CompilationUnit[] = [];

      // 过滤出需要重新编译的文件
      for (const currentUnit of this.compilationUnits) {
        const cachedUnit = cacheMap.get(currentUnit.file);

        if (!cachedUnit) {
          // 没有缓存记录，需要编译
          unitsToCompile.push(currentUnit);
          continue;
        }

        // 1. 元数据对比
        if (
          cachedUnit.fileSize === currentUnit.fileSize &&
          currentUnit.mtime === cachedUnit.mtime
        ) {
          // 元数据完全一致，极大概率未变化，直接使用缓存输出
          currentUnit.output = cachedUnit.output;
          continue;
        }

        // 2. 内容哈希对比
        // 只有元数据不同或文件不存在于缓存时，才需要计算哈希
        const currentHash = genHashByXXH(currentUnit.source);

        if (cachedUnit?.hash === currentHash) {
          // 哈希一致，内容实际相同，使用缓存
          currentUnit.output = cachedUnit.output;
        } else {
          // 哈希不同，或文件不存在于缓存中，需要编译
          // 将当前计算出的哈希存入unit，供后续缓存写入使用
          currentUnit.hash = currentHash;
          unitsToCompile.push(currentUnit);
        }
      }

      // 更新编译单元列表
      this.compilationUnits = unitsToCompile;
    } catch (e) {
      // 缓存读取失败，忽略错误并编译所有文件
      this.print(kleur.yellow('Cache read failed, recompiling all files'));
      console.error('\n', e, '\n');
    }
  }

  /**
   * 编译所有 Vue SFC 文件为 React 组件
   */
  private async compileVueFiles() {
    const { format } = this.options;

    // 使用 Promise.all 并行编译
    const processedUnits: Promise<CompilationUnit>[] = this.compilationUnits.map(async (unit) => {
      try {
        const start = performance.now();

        // 编译
        const result = this.compile(unit.source, unit.file);
        const { jsx, css } = result.fileInfo;

        // 默认不启用代码格式化，这会增加编译耗时
        const formattedCode = !format?.enabled ? result.code : await this.formatCode(result);

        // 计算单个编译的核心耗时
        const duration = this.formattDuration(performance.now() - start);

        // 输出编译信息
        this.print(
          kleur.magenta('Compiled'),
          kleur.green(normalizePath(this.relativePath(unit.file))),
          kleur.dim(kleur.cyan(`(${duration})`)),
        );

        // 记录编译产生的 css 附属文件
        if (css.path && css.code) {
          this.assetFiles.push({
            path: css.path,
            content: css.code,
          });
        }

        return {
          ...unit,
          output: {
            file: jsx.path,
            code: formattedCode,
            map: result.map,
          },
        };
      } catch (e) {
        // 编译失败，保留原始单元
        this.print(kleur.red(`Failed to compile ${this.relativePath(unit.file)}`));
        console.error('\n', e, '\n');
        return unit;
      }
    });

    // 更新 compilationUnits
    this.compilationUnits = await Promise.all(processedUnits);
  }

  private async writeReactFiles() {
    // 并行写入 jsx 文件
    const writePromises = this.compilationUnits.map(async (unit) => {
      // 跳过没有生成输出的单元（可能是编译失败）
      if (!unit.output) {
        this.print(kleur.yellow(`Skipping write for ${unit.file} (no output)`));
        return;
      }

      const { file, code } = unit.output;

      // 确保目录存在
      const outputDir = path.dirname(file);

      await fs.promises.mkdir(outputDir, { recursive: true });

      // 写入文件
      await fs.promises.writeFile(file, code, 'utf-8');
    });

    // 等待所有写入操作完成
    await Promise.all(writePromises);
  }

  /**
   * 删除输出目录中对应于已被删除的源文件的生成文件（与上次编译相比）
   */
  private async patchDeletedOutputs() {
    const cacheFilePath = this.getCompileCachePath();

    if (!fs.existsSync(cacheFilePath)) {
      return;
    }

    let existingCache: CompileCache | null = null;
    try {
      const content = await fs.promises.readFile(cacheFilePath, 'utf-8');
      existingCache = JSON.parse(content) as CompileCache;
    } catch {
      return;
    }

    const discoveredSet = new Set(this.discoveredVueFiles || []);

    for (const unit of existingCache.compileRes || []) {
      if (!unit || !unit.file) continue;

      // 如果源文件不在本次发现列表，则其输出应被删除
      if (!discoveredSet.has(unit.file)) {
        const out = unit.output?.file;
        if (out && fs.existsSync(out)) {
          try {
            await fs.promises.unlink(out);
          } catch {}
        }
      }
    }
  }

  /**
   * 编译结果写入文件缓存
   */
  private async writeCompileCache() {
    const file = this.getCompileCachePath();

    // 读取已有缓存（如果存在），以便与本次编译结果合并，避免覆盖未变更的条目
    let existingCache: CompileCache | null = null;

    if (fs.existsSync(file)) {
      try {
        const content = await fs.promises.readFile(file, 'utf-8');
        existingCache = JSON.parse(content) as CompileCache;
      } catch (e) {
        existingCache = null;
        console.error(e);
      }
    }

    const cacheMap = new Map<string, any>();

    if (existingCache?.compileRes && Array.isArray(existingCache.compileRes)) {
      for (const u of existingCache.compileRes) {
        cacheMap.set(u.file, u);
      }
    }

    // 将本次编译单元（通常仅包含需要重新编译的文件）合并到缓存中
    for (const unit of this.compilationUnits) {
      const { source: _, ...rest } = unit as any;

      // 保留 output.code，但剔除 map（如果存在）以减小缓存体积
      if (rest.output && rest.output.map) {
        rest.output.map = null;
      }

      cacheMap.set(rest.file, rest);
    }

    const merged = Array.from(cacheMap.values());

    // 根据本次发现的源文件列表，剔除已不存在的缓存项
    const discoveredSet = new Set(this.discoveredVueFiles || []);
    const filtered = merged.filter((u: any) => discoveredSet.has(u.file));
    const data = JSON.stringify({ compileRes: filtered } as CompileCache);

    // 确保缓存目录存在
    const cacheDir = path.dirname(file);

    await fs.promises.mkdir(cacheDir, { recursive: true });
    await fs.promises.writeFile(file, data, 'utf-8');
  }

  /**
   * 副管线，拷贝/生成 Vue 项目所包含的其他附属文件资源
   */
  private async assetPipeline() {
    if (!this.discoveredVueFiles.length) {
      return;
    }

    // 1. 收集除 .vue 外的所有附属文件
    await this.collectAssetFiles(this.getInputPath());

    if (!this.assetFiles.length) {
      return;
    }

    // 2. 并行拷贝/生成所有附属文件
    await this.copyOrGenerateAssets();

    // 3. 写入附属文件缓存
    await this.writeAssetCache();

    // 4. 清理已删除的附属文件
    await this.patchDeletedAssets();
  }

  /**
   * 从目录中收集除 .vue 外的所有附属文件
   */
  private async collectAssetFiles(dirPath: string) {
    const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
    const { recursive = true } = this.options;

    const collectPromises = entries.map(async (entry) => {
      const fullPath = path.join(dirPath, entry.name);

      // 跳过不需要的路径和 .vue 文件
      if (this.shouldSkipPath(fullPath) || entry.name.endsWith('.vue')) {
        return;
      }

      if (recursive && entry.isDirectory()) {
        // 递归处理子目录
        await this.collectAssetFiles(fullPath);
      } else if (entry.isFile()) {
        // 计算输出路径
        const outputPath = this.resolveOutputPath(fullPath);

        this.assetFiles.push({
          path: outputPath,
        });
      }
    });

    await Promise.all(collectPromises);
  }

  /**
   * 并行拷贝或生成附属文件
   */
  private async copyOrGenerateAssets() {
    const copyPromises = this.assetFiles.map(async (asset) => {
      try {
        // 确保输出目录存在
        const outputDir = path.dirname(asset.path);
        await fs.promises.mkdir(outputDir, { recursive: true });

        if (asset.content) {
          // 生成文件（含内容的资源文件，如 CSS）
          const outputPath = this.resolveOutputPath(asset.path);
          await fs.promises.writeFile(outputPath, asset.content, 'utf-8');
        } else {
          // 拷贝文件 - 从源文件获取路径
          const sourceFile = this.getSourcePath(asset.path);

          if (fs.existsSync(sourceFile)) {
            await fs.promises.copyFile(sourceFile, asset.path);
          }
        }
      } catch (e) {
        this.print(kleur.red(`Failed to copy/generate asset ${asset.path}`));
        console.error('\n', e, '\n');
      }
    });

    await Promise.all(copyPromises);
  }

  /**
   * 写入附属文件缓存
   */
  private async writeAssetCache() {
    const file = this.getAssetCachePath();

    // 准备缓存数据 - 不保存 content 字段
    const cacheData = this.assetFiles.map((asset) => {
      const { content: _, ...rest } = asset;
      return rest;
    });

    const cache = JSON.stringify({ assetFiles: cacheData } as AssetCache);

    // 确保缓存目录存在
    const cacheDir = path.dirname(file);

    await fs.promises.mkdir(cacheDir, { recursive: true });
    await fs.promises.writeFile(file, cache, 'utf-8');
  }

  /**
   * 清理已删除的附属文件
   */
  private async patchDeletedAssets() {
    const cacheFilePath = this.getAssetCachePath();

    if (!fs.existsSync(cacheFilePath)) {
      return;
    }

    let existingCache: AssetCache | null = null;
    try {
      const content = await fs.promises.readFile(cacheFilePath, 'utf-8');
      existingCache = JSON.parse(content) as AssetCache;
    } catch {
      return;
    }

    // 创建当前资源文件的 Set 以快速查找
    const currentAssetSet = new Set(this.assetFiles.map((a) => a.path));

    // 删除缓存中但不在当前列表中的文件
    if (existingCache.assetFiles && Array.isArray(existingCache.assetFiles)) {
      const deletePromises = existingCache.assetFiles.map(async (asset) => {
        if (!currentAssetSet.has(asset.path) && fs.existsSync(asset.path)) {
          try {
            await fs.promises.unlink(asset.path);
          } catch {}
        }
      });

      await Promise.all(deletePromises);
    }
  }

  /**
   * 输出已跳过编译的文件统计信息
   */
  private skippedFilesCount() {
    const skippedCount = this.discoveredVueFiles.length - this.compilationUnits.length;

    if (skippedCount > 0) {
      this.print(
        kleur.green(`✓`),
        kleur.gray(`Skipped ${skippedCount} unchanged file(s) using cache`),
      );
    }
  }

  clear() {
    this.compilationUnits = [];
    this.discoveredVueFiles = [];
    this.assetFiles = [];
  }
}
