import { formatWithPrettier, simpleFormat } from '@plugins/prettier';
import { logger } from '@shared/logger';
import { normalizePath, PathFilter } from '@shared/path';
import { genHashByXXH } from '@utils/hash';
import fs from 'fs';
import kleur from 'kleur';
import path from 'path';
import { fileLock, FileLockOptions } from './file-lock-manager';
import {
  CacheCheckResult,
  CacheMeta,
  CompilationResult,
  CompilerOptions,
  FileMeta,
  LoadedCache,
  ScriptCompilationResult,
  SFCCompilationResult,
} from './types';

export class Helper {
  private compilerOpts: CompilerOptions;
  private pathFilter: PathFilter;
  private workspaceDir = '.vureact';
  private outDir = 'react-app';

  constructor(opts: CompilerOptions) {
    this.compilerOpts = opts;

    if (opts.output?.workspace) {
      this.workspaceDir = opts.output.workspace;
    }

    // 创建路径过滤器
    const excludePatterns = PathFilter.withDefaults(opts.exclude || []);

    this.pathFilter = new PathFilter(excludePatterns);
  }

  /**
   * 获取用户的项目根目录
   */
  getProjectRoot(): string {
    const { root } = this.compilerOpts;
    return root || process.cwd();
  }

  /**
   * 获取输入文件的路径
   */
  getInputPath(): string {
    const { input = 'src' } = this.compilerOpts;
    return path.resolve(this.getProjectRoot(), input);
  }

  /**
   * 获取输出文件的路径。如：'[root]/.vureact/dist/'
   * @param addInput 会输出如：'[root]/.vureact/dist/[input]/'
   */
  getOuputPath(addInput = false): string {
    const { input = 'src' } = this.compilerOpts;
    return path.resolve(this.getWorkspaceDir(), this.getOutDirName(), addInput ? input : '');
  }

  getOutDirName() {
    const { output } = this.compilerOpts;
    return output?.outDir || this.outDir;
  }

  getWorkspaceDir(): string {
    return path.resolve(this.getProjectRoot(), this.workspaceDir);
  }

  /**
   * 根据相对输出路径反推源文件路径
   */
  getSourcePath(outputPath: string): string {
    const relativePath = path.relative(this.getOuputPath(), outputPath);
    return path.resolve(this.getProjectRoot(), relativePath);
  }

  getIgnoreAssets(): Set<string> {
    const { output } = this.compilerOpts;

    if (output?.ignoreAssets) {
      return new Set(output.ignoreAssets.map(normalizePath));
    }

    return new Set([
      'package.json',
      'package-lock.json',
      'pnpm-lock.yaml',
      'index.html',
      'yarn-lock.',
      'tsconfig.',
      'vite.config.',
      'eslint.config.',
      'readme.',
      'vue.',
      '.vue',
      'vureact.config.js',
      'vureact.config.ts',
    ]);
  }

  getIsCache(): boolean {
    return this.compilerOpts.cache ?? true;
  }

  /**
   * 返回原始目录下的 package.json 路径
   */
  getRootPkgPath(): string {
    return path.join(this.getProjectRoot(), 'package.json');
  }

  /**
   * 返回 output 的 package.json 路径
   */
  getOutputPkgPath(): string {
    return path.join(this.getOuputPath(), 'package.json');
  }

  /**
   * 获取缓存文件路径
   */
  getCachePath(): string {
    const filename = '_metadata';
    return path.resolve(this.getProjectRoot(), this.workspaceDir, 'cache', `${filename}.json`);
  }

  /**
   * 返回文件相对工作区的路径
   */
  relativePath(filePath: string): string {
    return path.relative(this.getProjectRoot(), filePath);
  }

  /**
   * 替换 .vue 文件名后缀为 .jsx/.tsx
   * @param filePath 文件完整路径
   * @param ext 文件拓展名
   * @returns 返回文件的相对路径，不包含当前工作区路径
   */
  replaceVueFileExt(filePath: string, ext: string): string {
    const relativePath = this.relativePath(filePath);

    // 替换扩展名，同时处理多个可能的扩展名情况
    let newRelativePath = relativePath.replace(/\.vue$/i, ext);

    // 如果原始路径不是 .vue 扩展名（不太可能，但处理一下）
    if (newRelativePath === relativePath) {
      const { name, dir } = path.parse(relativePath);
      newRelativePath = path.join(dir, `${name}${ext}`);
    }

    return newRelativePath;
  }

  /**
   * 判断是否应该跳过不需要进行文件搜索的路径
   */
  shouldSkipPath(filePath: string): boolean {
    const baseName = path.basename(filePath);

    // 精确列出要跳过的系统目录，移除 baseName.startsWith('.')
    const defaultExcludes = ['node_modules', 'dist', 'build', '.git', '.DS_Store'];

    if (defaultExcludes.includes(baseName)) {
      return true;
    }

    // 检查是否为输出目录 (.vureact)
    const absoluteWorkspace = this.getWorkspaceDir();
    if (filePath.startsWith(absoluteWorkspace)) {
      return true;
    }

    return this.pathFilter.shouldExclude(filePath);
  }

  /**
   * 自动根据项目结构推导 react-app 目录下的对应位置
   */
  resolveOutputPath(filePath: string, extname?: string): string {
    const newRelativePath = extname
      ? this.replaceVueFileExt(filePath, `.${extname}`)
      : this.relativePath(filePath);

    const outputPath = path.resolve(this.getOuputPath(), newRelativePath);

    return outputPath;
  }

  /**
   * 格式化代码
   */
  async formatCode({ code, fileInfo }: CompilationResult): Promise<string> {
    const { format } = this.compilerOpts;

    if (!format?.enabled) return code;

    if (format?.formatter === 'builtin') {
      return simpleFormat(code);
    }

    const { lang } =
      (fileInfo as SFCCompilationResult['fileInfo'])?.jsx ??
      (fileInfo as ScriptCompilationResult['fileInfo'])?.script;

    return await formatWithPrettier(code, lang, format?.prettierOptions);
  }

  /**
   * 通用的缓存校验工具函数
   * @param current 当前文件元数据
   * @param cached  缓存中的旧数据
   * @param getSource 获取文件内容的函数（仅在元数据不一致时才调用，避免多余 I/O）
   */
  async checkCacheStatus(
    current: FileMeta,
    cached: CacheMeta | undefined,
    getSource: () => Promise<string>,
  ): Promise<CacheCheckResult> {
    // 1. 无缓存记录，必编
    if (!cached) return { shouldCompile: true };

    // 2. 基础元数据没变，直接跳过
    if (this.compareFileMeta(cached, current)) {
      return { shouldCompile: false };
    }

    // 3. 元数据变了（可能是用户加了个空格又删了），检查内容哈希
    const source = await getSource();
    const currentHash = this.genHash(source);

    if (cached.hash === currentHash) {
      return { shouldCompile: false };
    }

    return { shouldCompile: true, hash: currentHash };
  }

  /**
   * 对比相同两个文件的基础元数据
   */
  compareFileMeta(a: FileMeta, b: FileMeta): boolean {
    return a.fileSize === b.fileSize && a.mtime === b.mtime;
  }

  /**
   * 统一的写文件方法，包含自动创建目录（带文件互斥锁可选）
   * @param filePath - 要写入的文件路径
   * @param content - 要写入的内容
   * @param options - 可选配置项
   * @param options.lock - 是否启用文件锁（默认false）
   */
  async writeFileWithDir(
    filePath: string,
    content: string,
    options?: FileLockOptions & { lock?: boolean },
  ) {
    if (options?.lock) {
      await fileLock.updateFile(filePath, async () => content, options);
    } else {
      await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
      await fs.promises.writeFile(filePath, content, 'utf-8');
    }
  }

  async rmFile(filePath: string) {
    try {
      if (fs.existsSync(filePath)) {
        await fs.promises.rm(filePath, { recursive: true, force: true });
      }
    } catch {}
  }

  genHash(content: string) {
    return genHashByXXH(content);
  }

  getAbsPath(filePath: string): string {
    return path.isAbsolute(filePath) ? filePath : path.resolve(this.getProjectRoot(), filePath);
  }

  async getFileMeta(filePath: string): Promise<FileMeta> {
    const stats = await fs.promises.stat(filePath);
    return {
      fileSize: stats.size,
      mtime: stats.mtimeMs,
    };
  }

  async removeOutputFile(filePath: string, resolveOutputPath?: boolean) {
    const path = resolveOutputPath ? this.resolveOutputPath(filePath) : filePath;

    if (!fs.existsSync(path)) return;
    await fs.promises.unlink(path);
  }

  updateCache(targetFile: string, newData: any, cache: LoadedCache) {
    const index = cache.target.findIndex((c) => c.file === targetFile);

    // 更新缓存单元
    if (index > -1) {
      cache.target[index] = newData;
    } else {
      cache.target.push(newData);
    }
  }

  /**
   * 获取需要排除编译的文件
   */
  getExcludes() {
    if (!this.compilerOpts.exclude?.length) {
      return PathFilter.withDefaults();
    }
    return this.compilerOpts.exclude;
  }

  /**
   * 打印 core 模块执行过程中收集的日志
   */
  printCoreLogs() {
    const hasLogs = logger.getLogs().length > 0;
    if (!hasLogs) return;

    if (this.compilerOpts.logging) {
      const { enabled, ...options } = this.compilerOpts.logging;
      if (enabled ?? true) {
        logger.printAll(options);
      }
    } else {
      logger.printAll();
    }

    logger.clear();
  }

  print(...message: any[]) {
    if (this.compilerOpts.watch) {
      const time = new Date().toLocaleTimeString();
      // eslint-disable-next-line no-console
      console.info(kleur.dim(time), kleur.cyan(kleur.bold('[vureact]')), ...message);
      return;
    }

    // eslint-disable-next-line no-console
    console.info(...message);
  }

  /**
   * 读取 package.json 文件内容，并处理成对象返回
   */
  async resolvePackageFile(path: string): Promise<Record<string, any>> {
    if (!fs.existsSync(path)) {
      return {};
    }

    try {
      const content = await fs.promises.readFile(path, 'utf-8');

      // fix: 修复无内容造成 json 解析错误
      if (!content.trim()) {
        return {};
      }

      return JSON.parse(content);
    } catch (error) {
      console.error(kleur.red('❌'), `Failed to parse JSON file ${path}:\n`, error);
      return {};
    }
  }

  /**
   * 获取目录到文件的相对路径
   * @returns 结果路径不包含文件拓展名，并以诸如 ./ 开头
   */
  resolveRelativePath(from: string, to: string) {
    // 获取相对路径
    let relativePath = path.relative(from, to);

    // 去掉文件扩展名，如 .js 或者多拓展名 .tar.gz
    relativePath = relativePath.substring(0, relativePath.indexOf('.'));

    // 确保以 ./ 或 ../ 开头
    if (!relativePath.startsWith('.')) {
      relativePath = `./${relativePath}`;
    }

    return normalizePath(relativePath);
  }
}
