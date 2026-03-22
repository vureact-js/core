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
import { CompilerManager, SetupManager } from './setup-manager';

/**
 * 文件系统编译器 - 将 Vue 项目批量转换为 React 项目
 *
 * 提供完整的文件系统级别编译功能，包括 SFC、脚本、样式编译，
 * 资源拷贝、增量编译、缓存管理和 Vite 环境初始化。
 */
export class FileCompiler extends BaseCompiler {
  manager!: CompilerManager;
  private spinner = ora();

  constructor(options: CompilerOptions = {}) {
    super(options);
    new SetupManager(() => this);
  }

  /** 执行完整的编译流程 */
  async execute() {
    console.info('\n\n', kleur.magenta(`${kleur.bold('VUREACT')} v${this.version}`), '\n');

    const startTime = performance.now();

    const rmWorkspace = async () => {
      await this.rmFile(this.getWorkspaceDir());
    };

    try {
      if (!this.getIsCache()) {
        await rmWorkspace();
      }

      await this.manager.viteBootstrapper.bootstrapIfNeeded();

      const sfcCount = await this.runPipelineWithSpinner(CacheKey.SFC);
      const scriptCount = await this.runPipelineWithSpinner(CacheKey.SCRIPT);
      const styleCount = await this.runPipelineWithSpinner(CacheKey.STYLE);
      const assetCount = await this.runPipelineWithSpinner(CacheKey.ASSET);

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

  /** 处理单个 Vue 单文件组件（SFC） */
  async processSFC(
    filePath: string,
    existingCache?: LoadedCache<Vue2ReactCacheMeta>,
  ): Promise<SFCUnit | undefined> {
    return this.manager.fileProcessor.processSFC(filePath, existingCache);
  }

  /** 处理单个 JavaScript/TypeScript 脚本文件 */
  async processScript(
    filePath: string,
    existingCache?: LoadedCache<FileCacheMeta>,
  ): Promise<ScriptUnit | undefined> {
    return this.manager.fileProcessor.processScript(filePath, existingCache);
  }

  /** 处理单个 CSS/LESS/SCSS 样式文件 */
  async processStyle(
    filePath: string,
    existingCache?: LoadedCache<FileCacheMeta>,
  ): Promise<StyleUnit | undefined> {
    return this.manager.fileProcessor.processStyle(filePath, existingCache);
  }

  /** 处理单个文件（Vue 或 Script） */
  async processFile(
    key: CacheKey,
    filePath: string,
    existingCache?: LoadedCache,
  ): Promise<CompilationUnit | undefined> {
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

  /** 处理单个资源文件 */
  async processAsset(
    filePath: string,
    existingCache?: LoadedCache<FileCacheMeta>,
  ): Promise<FileCacheMeta | undefined> {
    return this.manager.assetManager.processAsset(filePath, existingCache);
  }

  /** 批量保存缓存 */
  async flushCache(key: CacheKey) {
    await this.manager.cacheManager.flushCache(key);
  }

  /** 删除指定路径对应的输出文件和缓存 */
  async removeOutputPath(targetPath: string, type: CacheKey) {
    return await this.manager.cleanupManager.removeOutputPath(targetPath, type);
  }

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

  private showCompileStats(
    endTime: string,
    sfcCount: number,
    scriptCount: number,
    styleCount: number,
    assetCount: number,
  ) {
    this.spinner.succeed(`Build completed in ${endTime}`);
    console.info();

    if (sfcCount || scriptCount || styleCount || assetCount) {
      const stats = [];
      if (sfcCount) stats.push(`${sfcCount} SFC(s)`);
      if (scriptCount) stats.push(`${scriptCount} script(s)`);
      if (styleCount) stats.push(`${styleCount} style(s)`);
      if (assetCount) stats.push(`${assetCount} asset(s)`);

      this.spinner.succeed(`Processed: ${stats.join(', ')}`);
    }

    const skippedCount =
      this.manager.pipelineManager.getSkippedCount() + this.manager.assetManager.getSkippedCount();

    if (skippedCount) {
      console.info(kleur.gray(`↷ Cached: ${kleur.white(skippedCount)} unchanged file(s)`));
      this.resetSkippedCount();
    }

    const dir = normalizePath(this.relativePath(this.getOuputPath()));
    console.info();
    console.info(`📦 Output: ${dir}`);
    console.info();
  }

  private resetSkippedCount() {
    this.manager.pipelineManager.resetSkippedCount();
    this.manager.assetManager.resetSkippedCount();
  }
}
