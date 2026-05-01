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

  private printTitle() {
    const purple = '\x1b[38;2;153;50;204m'; // #9932cc 的 RGB 值
    const reset = '\x1b[0m';

    console.info();
    console.info();
    console.info(`${purple}${kleur.bold('VUREACT')} v${this.version}${reset}`);
    console.info();
  }

  private updateSpinner(text: string) {
    this.spinner.stop();
    this.spinner.start(text);
  }

  /** 执行完整的编译流程 */
  async execute() {
    this.printTitle();

    try {
      // 当 cache 禁用时，编译前需清理可能存在的缓存文件
      if (!this.getIsCache()) {
        // fix：https://github.com/vureact-js/core/issues/27
        await this.rmFile(this.getCachePath());
      }
    } catch (err) {
      console.warn(kleur.yellow('⚠'), 'Failed to clear cache');
      console.info();
    }

    const { viteBootstrapper, fileProcessor, cacheManager, pipelineManager, assetManager } =
      this.manager;

    let startTime = 0;

    try {
      this.updateSpinner('Initializing Vite React env...');
      await viteBootstrapper.bootstrapIfNeeded();

      // feature：https://github.com/vureact-js/core/issues/28

      // 加载缓存
      const cacheMap = await cacheManager.loadAllCache();

      startTime = performance.now();

      this.updateSpinner('Scanning files...');
      const scanFiles = fileProcessor.scanFiles();

      this.updateSpinner('Compiling Vue to React...');
      const sfcCount = await pipelineManager.runSFC(scanFiles.vue, cacheMap);
      const scriptCount = await pipelineManager.runScript(scanFiles.script, cacheMap);
      const styleCount = await pipelineManager.runStyle(scanFiles.style, cacheMap);

      this.updateSpinner('Copying assets...');
      const assetCount = await assetManager.runAsset(scanFiles.assets, cacheMap);

      this.updateSpinner('Almost done...');

      await cacheManager.flushAllCache();
      await this.options.onSuccess?.();

      const endTime = calcElapsedTime(startTime);

      this.printCoreLogs();
      this.showCompileStats(endTime, sfcCount, scriptCount, styleCount, assetCount);
    } catch (error) {
      this.spinner.stop();

      console.error(kleur.red('✖'), `Build failed in ${calcElapsedTime(startTime)}`);
      console.error(error);

      // 失败情况下删除整个输出目录
      await this.rmFile(this.getWorkspaceDir());

      // 出错后需结束当前进程
      process.exit(-1);
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

  /** 删除指定路径对应的输出文件和缓存 */
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
    this.spinner.succeed(`Build completed in ${endTime}`);

    if (sfcCount || scriptCount || styleCount || assetCount) {
      const stats = [];
      if (sfcCount) stats.push(`${sfcCount} ${kleur.dim('SFC(s)')}`);
      if (scriptCount) stats.push(`${scriptCount} ${kleur.dim('script(s)')}`);
      if (styleCount) stats.push(`${styleCount} ${kleur.dim('style(s)')}`);
      if (assetCount) stats.push(`${assetCount} ${kleur.dim('asset(s)')}`);

      this.spinner.succeed(`${kleur.bold('Processed')}: ${stats.join(', ')}`);
    }

    const skippedCount =
      this.manager.pipelineManager.getSkippedCount() + this.manager.assetManager.getSkippedCount();

    if (skippedCount) {
      console.info();
      console.info(
        kleur.gray(`↷ ${kleur.bold('Cached')}: ${kleur.white(skippedCount)} unchanged file(s)`),
      );
      this.resetSkippedCount();
    }

    const dir = normalizePath(this.relativePath(this.getOuputPath()));

    console.info();
    console.info(`📦 ${kleur.bold('Output')}: ${kleur.cyan(dir)}`);
    console.info();

    console.info(`  >  cd ${dir}`);
    console.info(`  >  npm install`);
    console.info(`  >  npm run dev`);

    console.info();
    console.info(
      kleur.dim('⭐ If you like VuReact, give us a star on GitHub:'),
      kleur.gray(kleur.underline('https://github.com/vureact-js/core')),
    );
    console.info();
  }

  private resetSkippedCount() {
    this.manager.pipelineManager.resetSkippedCount();
    this.manager.assetManager.resetSkippedCount();
  }
}
