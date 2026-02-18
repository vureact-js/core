import { normalizePath } from '@shared/path';
import { calcElapsedTime } from '@utils/calc-elapsed-time';
import fs from 'fs';
import kleur from 'kleur';
import path from 'path';
import { BaseCompiler } from './base-compiler';
import {
  CacheKey,
  CacheMeta,
  CompilerOptions,
  FileCacheMeta,
  LoadedCache,
  ScriptCompilationResult,
  ScriptUnit,
  SFCCompilationResult,
  SFCUnit,
  Vue2ReactCacheMeta,
} from './types';

/**
 * 文件系统编译器，负责批量处理 Vue 文件和资源文件的编译。
 *
 * 此类继承自 {@link BaseCompiler}，提供文件系统级别的编译功能，包括：
 * 1. 批量扫描和编译 Vue 文件
 * 2. 资源文件（非 Vue 文件）的拷贝处理
 * 3. 增量编译和缓存管理
 * 4. 文件系统监控和清理
 *
 * 主要特性：
 * - 增量编译：基于文件哈希和元数据变化检测，跳过未变更的文件
 * - 缓存管理：维护编译缓存，支持清理过期文件
 * - 资源处理：自动拷贝非 Vue 文件到输出目录
 * - 错误恢复：单个文件编译失败不影响其他文件处理
 *
 * @example
 * ```typescript
 * // 创建文件编译器实例
 * const compiler = new FileCompiler({
 *   input: './src',
 *   watch: true,
 *   output: {
 *    workspace: '.vureact',
 *    outDir: 'dist'
 *   },
 * });
 *
 * // 执行完整编译
 * await compiler.execute();
 *
 * // 处理单个 Vue 文件
 * const vueResult = await compiler.processSFC('/path/to/Component.vue');
 *
 * // 处理单个 Script 文件
 * const scriptResult = await compiler.processSFC('/path/to/foo.ts');
 *
 * // 处理单个资源文件
 * const assetMeta = await compiler.processAsset('/path/to/image.png');
 *
 * // 清理指定路径的输出文件
 * await compiler.removeOutputPath('/path/to/old-component.vue', CacheKey.SFC);
 * ```
 *
 * @remarks
 * - 缓存机制：使用文件哈希、大小和修改时间进行变更检测
 * - 并发处理：支持 Promise.all 并发处理多个文件
 * - 目录结构：保持输入目录结构到输出目录
 * - 错误处理：编译错误会记录日志但不会中断整个流程
 *
 * @see {@link BaseCompiler} 提供核心编译功能
 * @see {@link Helper} 提供基础工具方法
 */
export class FileCompiler extends BaseCompiler {
  private skippedCount = 0;

  /**
   * 创建文件系统编译器实例
   *
   * @param options - 编译器选项，继承自 BaseCompiler 的选项
   */
  constructor(options: CompilerOptions = {}) {
    super(options);
  }

  /**
   * Execute the initial full build.
   */
  async execute() {
    // eslint-disable-next-line no-console
    console.info('\n\n', kleur.yellow(`${kleur.bold('vureact')} v${this.version}`), '\n');

    // 1. Vue文件处理管线
    await this.sfcPipeline();

    // 2. Script 文件处理管线
    await this.scriptPipeline();

    // 3. 资源拷贝处理管线 (剩余无需处理的文件)
    await this.assetPipeline();

    await this.options.onSuccess?.();

    if (this.skippedCount) {
      console.info(kleur.green('✔'), kleur.gray(`Skipped ${this.skippedCount} unchanged file(s)`));
      this.skippedCount = 0;
    }
  }

  private async sfcPipeline() {
    await this.corePipeline(CacheKey.SFC);
  }

  private async scriptPipeline() {
    await this.corePipeline(CacheKey.SCRIPT);
  }

  private async corePipeline(key: CacheKey.SFC | CacheKey.SCRIPT) {
    const inputPath = this.getInputPath();

    const files = this.scanFiles(inputPath, (p) => {
      const ext = path.extname(p);
      if (key === CacheKey.SFC) return ext === '.vue';
      if (key === CacheKey.SCRIPT) return ext === '.js' || ext === '.ts';
      return false;
    });

    if (!files.length) return;
    const absFiles = new Set(files.map((f) => this.getAbsPath(f)));

    // 加载一次缓存供批量对比
    const cache = await this.loadCache(key);

    await this.cleanupOldOutput(key, (c) => !absFiles.has(c.file));
    await Promise.all(files.map(async (f) => this.processFile(key, f, cache)));
  }

  /**
   * Process a single Vue file (this method is called directly in CLI Watch mode)
   * @param filePath Absolute path
   * @param existingCache Optional preloaded cache object
   */
  async processSFC(filePath: string, existingCache?: LoadedCache<Vue2ReactCacheMeta>) {
    return this.processFile(CacheKey.SFC, filePath, existingCache);
  }

  /**
   * Process a single script file (this method is called directly in CLI Watch mode)
   * @param filePath Absolute path
   * @param existingCache Optional preloaded cache object
   */
  async processScript(filePath: string, existingCache?: LoadedCache<FileCacheMeta>) {
    return this.processFile(CacheKey.SCRIPT, filePath, existingCache);
  }

  /**
   * Process a single vue or script file (this method is called directly in CLI Watch mode)
   * @param filePath Absolute path
   * @param existingCache Optional preloaded cache object
   */
  async processFile(
    key: CacheKey.SFC,
    filePath: string,
    existingCache?: LoadedCache<Vue2ReactCacheMeta> | undefined,
  ): Promise<SFCUnit | undefined>;

  async processFile(
    key: CacheKey.SCRIPT,
    filePath: string,
    existingCache?: LoadedCache<FileCacheMeta> | undefined,
  ): Promise<ScriptUnit | undefined>;

  async processFile(
    key: CacheKey.SFC | CacheKey.SCRIPT,
    filePath: string,
    existingCache?: LoadedCache<FileCacheMeta> | undefined,
  ): Promise<SFCUnit | ScriptUnit | undefined>;

  async processFile(key: CacheKey, filePath: string, existingCache?: LoadedCache) {
    const start = performance.now();
    const absPath = this.getAbsPath(filePath);

    // 1. 获取最新元数据
    const fileMeta = await this.getFileMeta(absPath);

    // 2. 校验缓存
    const cache = existingCache || (await this.loadCache(key));
    const record = cache.target.find((c) => c.file === absPath);

    const { shouldCompile, hash } = await this.checkCacheStatus(fileMeta, record, () =>
      fs.promises.readFile(absPath, 'utf-8'),
    );

    if (!shouldCompile) {
      this.skippedCount++;
      return;
    }

    // 3. 编译
    const source = await fs.promises.readFile(absPath, 'utf-8');

    if (!source.trim()) return;

    // 初始化编译单元
    const initUnit: SFCUnit | ScriptUnit = {
      ...fileMeta,
      file: absPath,
      fileId: '',
      source,
      hash: hash || this.genHash(source),
      output: null,
    };

    // 4. 执行流水线
    const processed = await this.processCompilationUnit(initUnit, key);

    // 5. 产物落地与缓存同步
    if (processed?.output) {
      await this.saveCompiledFiles(processed, key);
      await this.updateCacheIncrementally(processed, key);
    }

    // 计算单个编译耗时
    const duration = calcElapsedTime(start);
    this.printCompileInfo(initUnit.file, duration);

    return processed;
  }

  /**
   * 处理编译单元，落地成对应代码和文件
   */
  private async processCompilationUnit(
    unit: SFCUnit | ScriptUnit,
    key: CacheKey,
  ): Promise<SFCUnit | ScriptUnit> {
    try {
      const result = this.compile(unit.source, unit.file);
      const formattedCode = await this.formatCode(result);

      unit.fileId = result.fileId;

      if (key === CacheKey.SFC) {
        const { jsx, css } = (result as SFCCompilationResult).fileInfo;

        if (css.file) {
          css.file = this.resolveOutputPath(css.file);
        }

        unit.output = {
          jsx: {
            file: jsx.file,
            code: formattedCode,
          },
          css,
        };
      } else if (key === CacheKey.SCRIPT) {
        const { script } = (result as ScriptCompilationResult).fileInfo;

        unit.output = {
          script: {
            file: script.file,
            code: formattedCode,
          },
        };
      }
    } catch (err) {
      this.print(kleur.red(`✖ Failed to compile ${this.relativePath(unit.file)}`));
      console.error(err);
    }

    return unit;
  }

  /**
   * 将编译产物写入磁盘
   */
  private async saveCompiledFiles(unit: SFCUnit | ScriptUnit, key: CacheKey) {
    const output = unit.output;
    if (!output) return;

    let file = '';
    let code = '';

    if (key === CacheKey.SFC) {
      const { jsx, css } = (output as SFCUnit['output'])!;
      file = jsx.file;
      code = jsx.code;

      // 如果有样式产物，写入 CSS 文件
      if (css.file && css.code) {
        await this.writeFileWithDir(css.file, css.code);
      }
    } else {
      const { script } = (output as ScriptUnit['output'])!;
      file = script.file;
      code = script.code;
    }

    await this.writeFileWithDir(file, code);
  }

  /**
   * 增量更新缓存记录
   */
  private async updateCacheIncrementally(unit: SFCUnit | ScriptUnit, key: CacheKey) {
    const cache = await this.loadCache(key);
    const meta = { ...unit };

    // 缓存不存源码和输出内容
    delete (meta as any).source;

    if (key === CacheKey.SFC) {
      delete (meta as any).output.jsx.code;
      delete (meta as any).output.css.code;
    } else if (key === CacheKey.SCRIPT) {
      delete (meta as any).output.script.code;
    }

    this.updateCache(unit.file, meta, cache);
    await this.saveCache(cache);
  }

  /**
   * 拷贝源项目 src 中所包含的其他附属文件资源（非 .vue 文件）
   */
  private async assetPipeline() {
    const inputPath = this.getInputPath();

    const assetFiles = this.scanFiles(inputPath, (p) => {
      const ext = path.extname(p);
      return ext !== '.vue' && ext !== '.js' && ext !== '.ts';
    });

    const absFiles = new Set(assetFiles.map((f) => this.getAbsPath(f)));

    // 加载资产缓存
    const cache = await this.loadCache(CacheKey.ASSET);

    // 清理缓存中已删除的资产及其输出文件
    await this.cleanupOldOutput(CacheKey.ASSET, (u) => !absFiles.has(u.file));

    // 更新缓存
    await this.updateAssetCaches(assetFiles, cache);
  }

  private async updateAssetCaches(files: string[], cache: LoadedCache<FileCacheMeta>) {
    for (const file of files) {
      const meta = await this.processAsset(file, cache);
      this.updateCache(file, meta, cache);
    }

    await this.saveCache(cache);
  }

  /**
   * Process single asset file, compare with cache and decide whether to copy.
   */
  async processAsset(
    filePath: string,
    existingCache?: LoadedCache<FileCacheMeta>,
  ): Promise<FileCacheMeta> {
    const absPath = this.getAbsPath(filePath);

    const fileMeta: FileCacheMeta = {
      file: absPath,
      ...(await this.getFileMeta(absPath)),
    };

    const cache = existingCache || (await this.loadCache(CacheKey.ASSET));

    // 查找缓存记录
    const record = cache.target.find((f) => f.file === absPath);

    // 如果元数据（大小、时间）未变，跳过拷贝
    if (record && this.compareFileMeta(record, fileMeta)) {
      return fileMeta;
    }

    // 计算输出路径并执行拷贝
    const outputPath = this.resolveOutputPath(absPath);

    await fs.promises.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.promises.copyFile(absPath, outputPath);

    this.print(kleur.blue('Copied Asset'), kleur.dim(normalizePath(this.relativePath(absPath))));

    return fileMeta;
  }

  /**
   * Delete the build artifacts and cache corresponding to the specified path.
   * @param targetPath The path of the source code (file or folder)
   * @param {CacheKey} type The type of cleanup
   */
  async removeOutputPath(targetPath: string, type: CacheKey) {
    const absPath = this.getAbsPath(targetPath);
    await this.cleanupOldOutput(
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
  private async cleanupOldOutput(key: CacheKey, filter: (m: CacheMeta) => boolean) {
    const cache = await this.loadCache(key as any);
    if (!cache.target.length) return;

    // 查找匹配条目：路径完全相等，或者是该路径下的子文件
    const toRemove = cache.target.filter(filter);
    if (!toRemove.length) return;

    const removeFn = async (m: CacheMeta) => {
      if (key === CacheKey.SFC) {
        const meta = m as Vue2ReactCacheMeta;
        if (!meta?.output) return;

        // 删除对应 jsx / css 文件
        const { jsx, css } = meta.output;
        this.removeOutputFile(jsx.file);

        if (css?.file) {
          this.removeOutputFile(css.file);
        }
      } else if (key === CacheKey.SCRIPT || key === CacheKey.ASSET) {
        // 普通缓存直接删除对应文件
        this.removeOutputFile(m.file, true);
      }
    };

    await Promise.all(toRemove.map(removeFn));
    await this.saveCache(cache);
  }
}
