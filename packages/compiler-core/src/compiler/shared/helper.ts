import { formatWithPrettier, simpleFormat } from '@plugins/prettier';
import { logger } from '@shared/logger';
import { normalizePath, PathFilter } from '@shared/path';
import { genHashByXXH } from '@utils/hash';
import { execSync } from 'child_process';
import fs from 'fs';
import kleur from 'kleur';
import path from 'path';
import {
  CacheCheckResult,
  CacheKey,
  CacheList,
  CacheMeta,
  CompilationResult,
  CompilerOptions,
  FileCacheMeta,
  FileMeta,
  LoadedCache,
  ScriptCompilationResult,
  SFCCompilationResult,
  Vue2ReactCacheMeta,
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
    const { input } = this.compilerOpts;
    return path.resolve(this.getProjectRoot(), input || 'src');
  }

  /**
   * 检查 input 路径是否是单个文件
   */
  isSingleFile(): boolean {
    const inputPath = this.getInputPath();
    return fs.existsSync(inputPath) && fs.statSync(inputPath).isFile();
  }

  /**
   * 获取输出文件的路径
   */
  getOuputPath(): string {
    return path.resolve(this.getWorkspaceDir(), this.getOutDirName());
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
      'tsconfig.',
      'vite.config.',
      'eslint.config.',
      'readme.',
      'vue.',
    ]);
  }

  getIsCache(): boolean {
    return this.compilerOpts.cache ?? true;
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
   * 统一的写文件方法，包含自动创建目录
   */
  async writeFileWithDir(filePath: string, content: string) {
    await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
    await fs.promises.writeFile(filePath, content, 'utf-8');
  }

  /**
   * 加载指定文件的缓存内容
   * @param key 缓存键
   */
  async loadCache(key: CacheKey.SFC): Promise<LoadedCache<Vue2ReactCacheMeta>>;

  async loadCache(key: CacheKey.SCRIPT | CacheKey.ASSET): Promise<LoadedCache<FileCacheMeta>>;

  async loadCache(
    key: CacheKey.SFC | CacheKey.SCRIPT | CacheKey.ASSET,
  ): Promise<LoadedCache<Vue2ReactCacheMeta | FileCacheMeta>>;

  async loadCache(key: CacheKey) {
    const cacheFile = this.getCachePath();
    const defaultData = this.createCacheData(key);

    if (!fs.existsSync(cacheFile)) {
      return defaultData;
    }

    try {
      const content = await fs.promises.readFile(cacheFile, 'utf-8');
      const data = JSON.parse(content) as CacheList;

      return {
        key,
        target: data[key] || [],
        source: data,
      };
    } catch {
      return defaultData;
    }
  }

  createCacheData(key: CacheKey): LoadedCache {
    return {
      key,
      target: [],
      source: {
        [CacheKey.SFC]: [],
        [CacheKey.SCRIPT]: [],
        [CacheKey.ASSET]: [],
      },
    };
  }

  /**
   * 获取缓存文件路径
   */
  getCachePath(): string {
    const filename = '_metadata';
    return path.resolve(this.getProjectRoot(), this.workspaceDir, 'cache', `${filename}.json`);
  }

  async saveCache(data?: LoadedCache) {
    if (!this.getIsCache() || !data) {
      return;
    }

    const { key, source, target } = data;
    source[key] = target as any[];
    await this.writeFileWithDir(this.getCachePath(), JSON.stringify(source));
  }

  genHash(content: string) {
    return genHashByXXH(content);
  }

  /**
   * 扫描指定目录下的所有文件
   * @param dir 目标目录
   * @param filter 筛选指定的文件后缀名
   */
  scanFiles(dir: string, filter: (file: string) => boolean): string[] {
    const results: string[] = [];

    if (!fs.existsSync(dir)) {
      return results;
    }

    const stats = fs.statSync(dir);

    if (stats.isFile()) {
      return filter(dir) ? [dir] : [];
    }

    const list = fs.readdirSync(dir);

    for (const file of list) {
      const fullPath = path.resolve(dir, file);

      if (this.shouldSkipPath(fullPath)) continue;

      const stat = fs.statSync(fullPath);

      if (stat.isDirectory() && this.compilerOpts.recursive !== false) {
        results.push(...this.scanFiles(fullPath, filter));
      } else if (filter(fullPath)) {
        results.push(fullPath);
      }
    }

    return results;
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

  resolveViteCreateApp() {
    const { output } = this.compilerOpts;
    const config = output?.bootstrapVite;
    const template = typeof config === 'object' ? config.template : 'react-ts';
    const outDirName = this.getOutDirName();

    // 执行 vite 创建命令，使用 --template xxx 跳过交互式选择
    const cmd = `npm create vite@latest ${outDirName} -- --template ${template}`;

    execSync(cmd, {
      cwd: this.getWorkspaceDir(),
      stdio: 'ignore', // 隐藏 create-vite 内部的输出日志，保持终端整洁
    });
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

  printCompileInfo(file: string, duration: string) {
    this.print(
      kleur.green('Compiled'),
      kleur.dim(normalizePath(this.relativePath(file))),
      kleur.gray(`(${duration})`),
    );
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
}
