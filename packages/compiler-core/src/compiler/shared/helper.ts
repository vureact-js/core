import { formatWithPrettier, simpleFormat } from '@plugins/prettier';
import { normalizePath, PathFilter } from '@shared/path';
import { genHashByXXH } from '@utils/hash';
import fs from 'fs';
import kleur from 'kleur';
import path from 'path';
import {
  AssetCache,
  CacheCheckResult,
  CacheFilename,
  CompileCache,
  CompileResult,
  CompilerOptions,
  FileMeta,
} from './types';

export class Helper {
  private compilerOpts: CompilerOptions;
  private pathFilter: PathFilter;
  private workspaceDir = '.vureact';

  constructor(opts: CompilerOptions) {
    this.compilerOpts = opts;

    if (opts.output?.workspace) {
      this.workspaceDir = opts.output.workspace;
    }

    // 创建路径过滤器
    const excludePatterns = PathFilter.withDefaults(opts.exclude || []);

    this.pathFilter = new PathFilter(excludePatterns);
  }

  protected print(...message: any[]) {
    // eslint-disable-next-line no-console
    console.info(`${kleur.gray('[vureact]')}`, ...message);
  }

  /**
   * 获取用户的项目根目录
   */
  protected getProjectRoot(): string {
    const { root } = this.compilerOpts;
    return root || process.cwd();
  }

  /**
   * 获取输入文件的路径
   */
  protected getInputPath(): string {
    const { input } = this.compilerOpts;
    return path.resolve(this.getProjectRoot(), input || 'src');
  }

  /**
   * 获取输出文件的路径
   */
  protected getOuputPath(): string {
    const { output } = this.compilerOpts;
    const outDir = output?.outDir || 'dist';
    return path.resolve(this.getProjectRoot(), this.workspaceDir, outDir);
  }

  /**
   * 根据相对输出路径反推源文件路径
   */
  protected getSourcePath(outputPath: string): string {
    const relativePath = path.relative(this.getOuputPath(), outputPath);
    return path.resolve(this.getProjectRoot(), relativePath);
  }

  /**
   * 1200 => '1.2s'
   *
   * 120 => '120ms'
   */
  protected formattDuration(n: number): string {
    const num = n < 1000 ? Math.floor(n) : n.toFixed(1);
    let duration = `${num} ms`;

    if (n >= 1000) {
      duration = `${(n / 1000).toFixed(1)}s`;
    }
    return duration;
  }

  /**
   * 返回文件相对工作区的路径
   */
  protected relativePath(filePath: string): string {
    return path.relative(this.getProjectRoot(), filePath);
  }

  /**
   * 替换 .vue 文件名后缀为 .jsx/.tsx
   * @param filePath 文件完整路径
   * @param ext 文件拓展名
   * @returns 返回文件的相对路径，不包含当前工作区路径
   */
  protected replaceVueFileExt(filePath: string, ext: string): string {
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
  protected shouldSkipPath(filePath: string): boolean {
    const baseName = path.basename(filePath);

    // 检查基础名称排除
    const defaultExcludes = ['node_modules', 'dist', 'build', '.git'];

    if (defaultExcludes.includes(baseName) || baseName.startsWith('.')) {
      return true;
    }

    // 检查是否为输出目录
    const absoluteWorkspace = path.resolve(this.getProjectRoot(), this.workspaceDir);

    if (filePath.startsWith(absoluteWorkspace)) {
      return true;
    }

    // 使用路径过滤器检查 glob 模式
    return this.pathFilter.shouldExclude(filePath);
  }

  /**
   * 自动根据项目结构推导 dist 目录下的对应位置
   */
  protected resolveOutputPath(filePath: string, extname?: string): string {
    const newRelativePath = extname
      ? this.replaceVueFileExt(filePath, `.${extname}`)
      : this.relativePath(filePath);

    const outputPath = path.resolve(this.getOuputPath(), newRelativePath);

    return outputPath;
  }

  /**
   * 格式化代码
   */
  protected async formatCode({ code, fileInfo }: CompileResult): Promise<string> {
    const { format } = this.compilerOpts;

    if (!format?.enabled) return code;

    if (format?.formatter === 'builtin') {
      return simpleFormat(code);
    }

    return await formatWithPrettier(code, fileInfo.jsx.lang, format?.prettierOptions);
  }

  /**
   * 通用的缓存校验工具函数
   * @param current 当前文件元数据
   * @param cached  缓存中的旧数据
   * @param getSource 获取文件内容的函数（仅在元数据不一致时才调用，避免多余 I/O）
   */
  protected async checkCacheStatus(
    current: FileMeta,
    cached: CompileCache['cached'][0] | undefined,
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
  protected compareFileMeta(a: FileMeta, b: FileMeta): boolean {
    return a.fileSize === b.fileSize && a.mtime === b.mtime;
  }

  /**
   * 统一的写文件方法，包含自动创建目录
   */
  protected async writeFileWithDir(filePath: string, content: string) {
    await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
    await fs.promises.writeFile(filePath, content, 'utf-8');
  }

  /**
   * 加载指定文件的缓存内容
   * @param name 文件名
   */
  protected async loadCache(name: CacheFilename.COMPILE): Promise<CompileCache>;
  protected async loadCache(name: CacheFilename.ASSET): Promise<AssetCache>;
  protected async loadCache(
    name: CacheFilename.COMPILE | CacheFilename.ASSET,
  ): Promise<CompileCache | AssetCache | null> {
    const cachePath = this.getCacheFilePath(name);

    if (!fs.existsSync(cachePath)) return null;

    try {
      const content = await fs.promises.readFile(cachePath, 'utf-8');
      return JSON.parse(content) as CompileCache;
    } catch {
      return null;
    }
  }

  /**
   * 获取缓存文件路径
   */
  protected getCacheFilePath(filename: string): string {
    return path.resolve(this.getProjectRoot(), this.workspaceDir, 'cache', `${filename}.json`);
  }

  protected async saveCache(filename: string, data: CompileCache | AssetCache) {
    await this.writeFileWithDir(this.getCacheFilePath(filename), JSON.stringify(data));
  }

  protected genHash(content: string) {
    return genHashByXXH(content);
  }

  /**
   * 扫描指定目录下的所有文件
   * @param dir 目标目录
   * @param filter 筛选指定的文件后缀名
   */
  protected scanFiles(dir: string, filter: (file: string) => boolean): string[] {
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

  protected getAbsPath(filePath: string): string {
    return path.isAbsolute(filePath) ? filePath : path.resolve(this.getProjectRoot(), filePath);
  }

  protected async getFileMeta(filePath: string): Promise<FileMeta> {
    const stats = await fs.promises.stat(filePath);
    return {
      fileSize: stats.size,
      mtime: stats.mtimeMs,
    };
  }

  protected async removeOutputFile(filePath: string, resolveOutputPath?: boolean) {
    const path = resolveOutputPath ? this.resolveOutputPath(filePath) : filePath;

    if (!fs.existsSync(path)) return;
    await fs.promises.unlink(path);

    this.print(kleur.yellow('Removed'), kleur.cyan(normalizePath(this.relativePath(path))));
  }
}
