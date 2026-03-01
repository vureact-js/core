import { normalizePath } from '@shared/path';
import { calcElapsedTime } from '@utils/calc-elapsed-time';
import fs from 'fs';
import kleur from 'kleur';
import ora from 'ora';
import { BaseCompiler } from '../base-compiler';
import {
  CacheKey,
  CompilerOptions,
  FileCacheMeta,
  LoadedCache,
  Vue2ReactCacheMeta,
} from '../types';
import { AssetManager } from './asset-manager';
import { CacheManager } from './cache-manager';
import { CleanupManager } from './cleanup-manager';
import { CompilationUnitProcessor } from './compilation-unit';
import { FileProcessor } from './file-processor';
import { PipelineManager } from './pipeline-manager';
import { ViteBootstrapper } from './vite-bootstrapper';

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
 *   input: 'src',
 *   exclude: ['src/main.ts'],
 *   output: {
 *    workspace: '.vureact',
 *    outDir: 'react-app'
 *   },
 * });
 *
 * // 执行完整编译
 * await compiler.execute();
 *
 * // 处理单个 Vue 文件
 * await compiler.processSFC('/path/to/Component.vue');
 *
 * // 处理单个 Script 文件
 * await compiler.processScript('/path/to/foo.ts');
 *
 * // 处理单个资源文件
 * await compiler.processAsset('/path/to/image.png');
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
  private spinner = ora();

  // 管理器实例
  private viteBootstrapper!: ViteBootstrapper;
  private pipelineManager!: PipelineManager;
  private fileProcessor!: FileProcessor;
  private compilationUnitProcessor!: CompilationUnitProcessor;
  private cacheManager!: CacheManager;
  private assetManager!: AssetManager;
  private cleanupManager!: CleanupManager;

  /**
   * 创建文件系统编译器实例
   *
   * @param options - 编译器选项，继承自 BaseCompiler 的选项
   */
  constructor(options: CompilerOptions = {}) {
    super(options);
    this.initializeManagers();
  }

  /**
   * 初始化所有管理器
   */
  private initializeManagers(): void {
    // 创建基础的管理器
    this.cacheManager = new CacheManager(this);
    this.cleanupManager = new CleanupManager(this);
    this.compilationUnitProcessor = new CompilationUnitProcessor(this);

    // 创建依赖其他管理器的管理器
    this.fileProcessor = new FileProcessor(this, this.compilationUnitProcessor, this.cacheManager);
    this.viteBootstrapper = new ViteBootstrapper(this, this.options);
    this.pipelineManager = new PipelineManager(this, this.fileProcessor);
    this.assetManager = new AssetManager(this, this.cleanupManager);
  }

  /**
   * Execute the initial full build.
   */
  async execute() {
    console.info('\n\n', kleur.cyan(`${kleur.bold('VUREACT')} v${this.version}`), '\n');
    const startTime = performance.now();

    // 没有启用缓存则清理上一次的输出产物
    if (!this.getIsCache()) {
      await fs.promises.rm(this.getWorkspaceDir(), { recursive: true, force: true });
    }

    // 0. 环境初始化管线
    await this.viteBootstrapper.bootstrapIfNeeded();

    try {
      // 1. Vue文件处理管线
      this.spinner.start('Compiling Vue files...');
      const sfcCount = await this.pipelineManager.runSfcPipeline();
      this.spinner.stop();

      // 2. Script 文件处理管线
      this.spinner.start('Compiling script files...');
      const scriptCount = await this.pipelineManager.runScriptPipeline();
      this.spinner.stop();

      // 3. 资源拷贝处理管线 (剩余无需处理的文件)
      this.spinner.start('Copying assets...');
      const assetCount = await this.assetManager.runAssetPipeline();
      this.spinner.stop();

      await this.options.onSuccess?.();
      const endTime = calcElapsedTime(startTime);

      this.printCoreLogs();
      this.showCompileStats(endTime, sfcCount, scriptCount, assetCount);
    } catch (error) {
      this.spinner.stop();
      const endTime = calcElapsedTime(startTime);
      console.error(kleur.red('✖'), `Build failed in ${endTime}\n`);
    }
  }

  /**
   * Process a single Vue file (this method is called directly in CLI Watch mode)
   * @param filePath Absolute path
   * @param existingCache Optional preloaded cache object
   */
  async processSFC(filePath: string, existingCache?: LoadedCache<Vue2ReactCacheMeta>) {
    return this.fileProcessor.processSFC(filePath, existingCache);
  }

  /**
   * Process a single script file (this method is called directly in CLI Watch mode)
   * @param filePath Absolute path
   * @param existingCache Optional preloaded cache object
   */
  async processScript(filePath: string, existingCache?: LoadedCache<FileCacheMeta>) {
    return this.fileProcessor.processScript(filePath, existingCache);
  }

  /**
   * Process a single vue or script file (this method is called directly in CLI Watch mode)
   */
  async processFile(key: CacheKey, filePath: string, existingCache?: LoadedCache) {
    // 类型转换以匹配 FileProcessor 的重载签名
    if (key === CacheKey.SFC) {
      return this.fileProcessor.processFile(key as CacheKey.SFC, filePath, existingCache);
    } else if (key === CacheKey.SCRIPT) {
      return this.fileProcessor.processFile(key as CacheKey.SCRIPT, filePath, existingCache);
    }
    return this.fileProcessor.processFile(
      key as CacheKey.SFC | CacheKey.SCRIPT,
      filePath,
      existingCache,
    );
  }

  /**
   * Process single asset file, compare with cache and decide whether to copy.
   */
  async processAsset(
    filePath: string,
    existingCache?: LoadedCache<FileCacheMeta>,
  ): Promise<FileCacheMeta> {
    return this.assetManager.processAsset(filePath, existingCache);
  }

  /**
   * Delete the build artifacts and cache corresponding to the specified path.
   * @param targetPath The path of the source code (file or folder)
   * @param {CacheKey} type The type of cleanup
   */
  async removeOutputPath(targetPath: string, type: CacheKey) {
    return this.cleanupManager.removeOutputPath(targetPath, type);
  }

  /**
   * 获取跳过的文件数量
   */
  getSkippedCount(): number {
    return this.skippedCount;
  }

  /**
   * 重置跳过的文件数量
   */
  resetSkippedCount(): void {
    this.skippedCount = 0;
  }

  private showCompileStats(
    endTime: string,
    sfcCount: number,
    scriptCount: number,
    assetCount: number,
  ): void {
    const dir = normalizePath(this.relativePath(this.getOuputPath()));
    this.spinner.succeed(`Build completed in ${endTime}`);
    console.info(`  Output directory: ${kleur.dim(dir)}`);

    this.skippedCount += this.pipelineManager.getSkippedCount();
    this.pipelineManager.resetSkippedCount();

    if (this.skippedCount) {
      console.info(kleur.dim(`Skipped ${this.skippedCount} unchanged file(s)`));
      this.resetSkippedCount();
    }

    // 显示编译统计
    if (sfcCount || scriptCount || assetCount) {
      const stats = [];
      if (sfcCount) stats.push(`${sfcCount} SFC(s)`);
      if (scriptCount) stats.push(`${scriptCount} script(s)`);
      if (assetCount) stats.push(`${assetCount} asset(s)`);

      console.info(kleur.gray(`Processed ${stats.join(', ')}`));
    }
  }
}
