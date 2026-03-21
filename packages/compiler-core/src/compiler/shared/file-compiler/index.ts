import { normalizePath } from '@shared/path';
import { calcElapsedTime } from '@utils/calc-elapsed-time';
import kleur from 'kleur';
import ora from 'ora';
import { BaseCompiler } from '../base-compiler';
import {
  CacheKey,
  CompilationUnit,
  CompilerOptions,
  FileCacheMeta,
  LoadedCache,
  ScriptUnit,
  SFCUnit,
  StyleUnit,
  Vue2ReactCacheMeta,
} from '../types';
import { AssetManager } from './asset-manager';
import { CacheManager } from './cache-manager';
import { CleanupManager } from './cleanup-manager';
import { FileProcessor } from './file-processor';
import { PipelineManager } from './pipeline-manager';
import { CompilerManager, SetupManager } from './setup-manager';
import { ViteBootstrapper } from './vite-bootstrapper';

/**
 * 文件系统编译器，负责将 Vue 项目批量转换为 React 项目。
 *
 * 此类继承自 {@link BaseCompiler}，提供完整的文件系统级别编译功能，包括：
 * 1. 批量扫描和编译 Vue 单文件组件（SFC）
 * 2. 处理 JavaScript/TypeScript 脚本文件
 * 2. 处理 Css/Less/Scss/Sass 样式文件
 * 3. 资源文件（图片、字体等）的智能拷贝
 * 4. 增量编译和高效的缓存管理
 * 5. 文件系统监控和自动清理
 * 6. Vite 项目环境自动初始化
 *
 * 主要特性：
 * - 增量编译：基于文件哈希、大小和修改时间进行变更检测，跳过未变更的文件
 * - 智能缓存：维护编译缓存，支持清理过期文件，提高编译效率
 * - 资源处理：自动识别并拷贝非编译文件，保持目录结构
 * - 错误隔离：单个文件编译失败不影响其他文件处理
 * - 并发处理：支持 Promise.all 并发处理多个文件，提升编译速度
 * - 路由感知：自动检测并注入 Vue Router 到 React Router 的转换依赖
 *
 * 架构设计：
 * 该类采用管理器模式，将不同职责分解到独立的子管理器中：
 * - {@link PipelineManager}: 管理编译管线流程
 * - {@link FileProcessor}: 处理单个文件的编译逻辑
 * - {@link CacheManager}: 管理编译缓存
 * - {@link AssetManager}: 处理资源文件拷贝
 * - {@link CleanupManager}: 清理过期文件和缓存
 * - {@link ViteBootstrapper}: 初始化 Vite React 项目环境
 *
 * @example
 * ```typescript
 * // 创建文件编译器实例
 * const compiler = new FileCompiler({
 *   input: 'src',
 *   exclude: ['src/main.ts'],
 *   output: {
 *     workspace: '.vureact',
 *     outDir: 'react-app',
 *     bootstrapVite: true
 *   }
 * });
 *
 * // 执行完整编译
 * await compiler.execute();
 *
 * // 处理单个 Vue 文件（适用于 watch 模式）
 * await compiler.processSFC('/path/to/Component.vue');
 *
 * // 处理单个 Script 文件
 * await compiler.processScript('/path/to/foo.ts');
 *
 * // 处理单个 Style 文件
 * await compiler.processStyle('/path/to/foo.scss');
 *
 * // 处理单个资源文件
 * await compiler.processAsset('/path/to/image.png');
 * ```
 *
 * @remarks
 * - 编译流程：遵循 "环境初始化 → SFC编译 → Script编译 →  Style编译 → 资源拷贝" 的顺序
 * - 缓存机制：使用文件哈希、大小和修改时间三重验证确保准确性
 * - 目录结构：保持输入目录结构到输出目录，便于项目迁移
 * - 错误处理：编译错误会记录到日志系统，但不会中断整个编译流程
 * - 性能优化：支持并发处理和增量编译，大幅提升大型项目编译速度
 *
 * @see {@link BaseCompiler} 提供核心的单文件编译功能
 * @see {@link Helper} 提供基础的文件路径处理和工具方法
 * @see {@link CompilerOptions} 完整的编译器配置选项
 */
export class FileCompiler extends BaseCompiler {
  // 管理器列表
  manager!: CompilerManager;

  private spinner = ora();

  constructor(options: CompilerOptions = {}) {
    super(options);
    new SetupManager(() => this);
  }

  /**
   * 执行完整的编译流程
   *
   * 该方法执行以下步骤：
   * 1. 环境初始化：清理旧输出（如果禁用缓存）并初始化 Vite 项目环境
   * 2. Vue 文件编译：批量处理所有 .vue 文件
   * 3. Script 文件编译：批量处理所有 .js/.ts 文件
   * 4. Style 文件编译：批量处理所有 .css/.less/.sass/.scss 文件
   * 5. 资源文件拷贝：处理剩余的非编译文件
   * 6. 统计输出：显示编译结果和性能统计
   *
   * @async
   * @throws {Error} 当编译过程中发生致命错误时抛出
   */
  async execute() {
    console.info('\n\n', kleur.magenta(`${kleur.bold('VUREACT')} v${this.version}`), '\n');

    const startTime = performance.now();

    const rmWorkspace = async () => {
      await this.rmFile(this.getWorkspaceDir());
    };

    try {
      // 没有启用缓存则清理上一次的输出产物
      if (!this.getIsCache()) {
        await rmWorkspace();
      }

      // 环境初始化管线
      await this.manager.viteBootstrapper.bootstrapIfNeeded();

      const sfcCount = await this.runPipelineWithSpinner(CacheKey.SFC);
      const scriptCount = await this.runPipelineWithSpinner(CacheKey.SCRIPT);
      const styleCount = await this.runPipelineWithSpinner(CacheKey.STYLE);
      const assetCount = await this.runPipelineWithSpinner(CacheKey.ASSET);

      // 执行用户自定义的成功回调
      await this.options.onSuccess?.();

      const endTime = calcElapsedTime(startTime);

      this.printCoreLogs();
      this.showCompileStats(endTime, sfcCount, scriptCount, styleCount, assetCount);
    } catch (error) {
      const endTime = calcElapsedTime(startTime);
      await rmWorkspace();

      console.error(kleur.red('✖'), `Build failed in ${endTime}`);
      console.error(error);
    } finally {
      this.resetSkippedCount();
    }
  }

  /**
   * 运行管线并显示加载动画
   *
   * @private
   * @param text - 加载动画显示的文本
   * @param pipelineFn - 要执行的管线函数
   * @returns 返回的处理的文件数
   */
  private async runPipelineWithSpinner(name: CacheKey): Promise<number> {
    const options = {
      [CacheKey.SFC]: {
        text: 'Compiling Vue files...',
        pipeline: () => this.manager.pipelineManager.runSfcPipeline(),
      },
      [CacheKey.SCRIPT]: {
        text: 'Compiling script files...',
        pipeline: () => this.manager.pipelineManager.runScriptPipeline(),
      },
      [CacheKey.STYLE]: {
        text: 'Compiling style files...',
        pipeline: () => this.manager.pipelineManager.runStylePipeline(),
      },
      [CacheKey.ASSET]: {
        text: 'Copying assets...',
        pipeline: () => this.manager.assetManager.runAssetPipeline(),
      },
    };

    const { text, pipeline } = options[name];

    try {
      this.spinner.start(text);
      return await pipeline();
    } catch (err) {
      throw err;
    } finally {
      this.spinner.stop();
    }
  }

  /**
   * 处理单个 Vue 单文件组件（SFC）
   *
   * 此方法主要用于 CLI 的 watch 模式，当检测到文件变更时调用。
   * 支持增量编译，如果文件未变更则跳过编译。
   *
   * @async
   * @param filePath - Vue 文件的绝对路径
   * @param existingCache - 可选的预加载缓存对象，用于增量编译
   * @returns {Promise<SFCUnit | undefined>} 编译单元对象，如果跳过编译则返回 undefined
   * @see {@link FileProcessor.processSFC}
   */
  async processSFC(
    filePath: string,
    existingCache?: LoadedCache<Vue2ReactCacheMeta>,
  ): Promise<SFCUnit | undefined> {
    return this.manager.fileProcessor.processSFC(filePath, existingCache);
  }

  /**
   * 处理单个 JavaScript/TypeScript 脚本文件
   *
   * 此方法主要用于 CLI 的 watch 模式，当检测到文件变更时调用。
   * 支持增量编译，如果文件未变更则跳过编译。
   *
   * @async
   * @param filePath - 脚本文件的绝对路径
   * @param existingCache - 可选的预加载缓存对象，用于增量编译
   * @returns {Promise<ScriptUnit | undefined>} 编译单元对象，如果跳过编译则返回 undefined
   * @see {@link FileProcessor.processScript}
   */
  async processScript(
    filePath: string,
    existingCache?: LoadedCache<FileCacheMeta>,
  ): Promise<ScriptUnit | undefined> {
    return this.manager.fileProcessor.processScript(filePath, existingCache);
  }

  /**
   * 处理单个 CSS/LESS/SCSS 样式文件
   *
   * 此方法主要用于 CLI 的 watch 模式，当检测到文件变更时调用。
   * 支持增量编译，如果文件未变更则跳过编译。
   *
   * @async
   * @param filePath - style 文件的绝对路径
   * @param existingCache - 可选的预加载缓存对象，用于增量编译
   * @returns {Promise<ScriptUnit | undefined>} 编译单元对象，如果跳过编译则返回 undefined
   * @see {@link FileProcessor.processStyle}
   */
  async processStyle(
    filePath: string,
    existingCache?: LoadedCache<FileCacheMeta>,
  ): Promise<StyleUnit | undefined> {
    return this.manager.fileProcessor.processStyle(filePath, existingCache);
  }

  /**
   * 处理单个文件（Vue 或 Script）
   *
   * 通用的文件处理方法，根据 CacheKey 类型自动选择处理逻辑。
   * 主要用于内部调用和统一的文件处理接口。
   *
   * @async
   * @param key - 文件类型标识（SFC 或 SCRIPT）
   * @param filePath - 文件的绝对路径
   * @param existingCache - 可选的预加载缓存对象
   * @returns {Promise<SFCUnit | ScriptUnit | undefined>} 编译单元对象
   * @see {@link FileProcessor.processFile}
   */
  async processFile(
    key: CacheKey,
    filePath: string,
    existingCache?: LoadedCache,
  ): Promise<CompilationUnit | undefined> {
    // 类型转换以匹配 FileProcessor 的重载签名
    if (key === CacheKey.SFC) {
      return this.manager.fileProcessor.processFile(key as CacheKey.SFC, filePath, existingCache);
    } else if (key === CacheKey.SCRIPT) {
      return this.manager.fileProcessor.processFile(
        key as CacheKey.SCRIPT,
        filePath,
        existingCache,
      );
    }
    return this.manager.fileProcessor.processFile(
      key as CacheKey.SFC | CacheKey.SCRIPT,
      filePath,
      existingCache,
    );
  }

  /**
   * 处理单个资源文件
   *
   * 比较文件与缓存，决定是否需要拷贝。
   * 资源文件包括图片、字体、样式文件等非编译文件。
   *
   * @async
   * @param filePath - 资源文件的绝对路径
   * @param existingCache - 可选的预加载缓存对象
   * @returns {Promise<FileCacheMeta>} 资源文件的缓存元数据
   * @see {@link AssetManager.processAsset}
   */
  async processAsset(
    filePath: string,
    existingCache?: LoadedCache<FileCacheMeta>,
  ): Promise<FileCacheMeta | undefined> {
    return this.manager.assetManager.processAsset(filePath, existingCache);
  }

  /**
   * 批量保存缓存
   */
  async flushCache(key: CacheKey) {
    // 通过 cacheManager 批量保存缓存
    await this.manager.cacheManager.flushCache(key);
  }

  /**
   * 删除指定路径对应的输出文件和缓存
   *
   * 当源文件被删除或重命名时，需要清理对应的输出文件。
   * 主要用于 watch 模式下的文件删除处理。
   *
   * @async
   * @param targetPath - 源代码的路径（文件或文件夹）
   * @param type - 清理类型，指定是 SFC、SCRIPT 还是 ASSET
   * @see {@link CleanupManager.removeOutputPath}
   */
  async removeOutputPath(targetPath: string, type: CacheKey) {
    return await this.manager.cleanupManager.removeOutputPath(targetPath, type);
  }

  private showCompileStats(
    endTime: string,
    sfcCount: number,
    scriptCount: number,
    styleCount: number,
    assetCount: number,
  ) {
    // 显示编译统计
    if (sfcCount || scriptCount || styleCount || assetCount) {
      const stats = [];
      if (sfcCount) stats.push(`${sfcCount} SFC(s)`);
      if (scriptCount) stats.push(`${scriptCount} script(s)`);
      if (styleCount) stats.push(`${styleCount} style(s)`);
      if (assetCount) stats.push(`${assetCount} asset(s)`);

      this.spinner.succeed(`Processed ${stats.join(', ')}`);
    }

    // 显示最终构建耗时
    this.spinner.succeed(`Build completed in ${endTime}`);

    // 显示跳过的文件统计
    const skippedCount =
      this.manager.pipelineManager.getSkippedCount() + this.manager.assetManager.getSkippedCount();

    if (skippedCount) {
      console.info();
      console.info(kleur.gray(`↷ Cached: ${kleur.white(skippedCount)} unchanged file(s)`));
      this.resetSkippedCount();
    }

    // 显示最终构建产物输出路径
    const dir = normalizePath(this.relativePath(this.getOuputPath()));
    console.info();
    console.info(`📦 Output: ${dir}`);
    console.info();

    // 显示引导应用预览
    const { output } = this.options;

    if (output?.bootstrapVite) {
      console.info('🚀  To start:');
      console.info(`  ${kleur.yellow('cd')} ${dir}`);
      console.info(`  ${kleur.yellow('npm')} install`);
      console.info(`  ${kleur.yellow('npm')} run dev`);
      console.info();
    }
  }

  /**
   * 重置跳过的文件数量
   *
   * 在每次新的编译会话开始时调用，重置计数器。
   */
  private resetSkippedCount() {
    this.manager.pipelineManager.resetSkippedCount();
    this.manager.assetManager.resetSkippedCount();
  }
}
