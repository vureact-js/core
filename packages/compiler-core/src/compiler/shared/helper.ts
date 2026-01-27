import { formatWithPrettier, simpleFormat } from '@plugins/prettier';
import { PathFilter } from '@shared/path';
import kleur from 'kleur';
import path from 'path';
import { CompileResult, CompilerOptions } from './types';

export class Helper {
  private compilerOpts: CompilerOptions;
  private pathFilter: PathFilter;
  private workspaceDir = '.vureact';

  constructor(opts: CompilerOptions) {
    this.compilerOpts = opts;

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
   * 获取编译缓存文件路径
   */
  protected getCompileCachePath(): string {
    return this.getCacheFilePath('compile-cache');
  }

  /**
   * 获取附属文件缓存路径
   */
  protected getAssetCachePath(): string {
    return this.getCacheFilePath('asset-cache');
  }

  /**
   * 获取缓存文件路径
   */
  protected getCacheFilePath(filename: string): string {
    return path.resolve(this.getProjectRoot(), this.workspaceDir, 'cache', `${filename}.json`);
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
   * @returns 返回文件的相对路径，不包含当前工作区路径
   */
  protected replaceVueFileExt(filePath: string, lang: string): string {
    const ext = lang.startsWith('ts') ? '.tsx' : '.jsx';

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
   * 处理编译后的文件输出路径
   */
  protected resolveOutputPath(filePath: string, lang?: string): string {
    const newRelativePath = lang
      ? this.replaceVueFileExt(filePath, lang)
      : this.relativePath(filePath);

    const outputPath = path.resolve(this.getOuputPath(), newRelativePath);

    return outputPath;
  }

  /**
   * 格式化代码
   */
  protected async formatCode(result: CompileResult): Promise<string> {
    const { format } = this.compilerOpts;
    let formattedCode = result.code;

    if (format?.formatter === 'builtin') {
      formattedCode = simpleFormat(result.code);
    } else {
      formattedCode = await formatWithPrettier(
        result.code,
        result.fileInfo.jsx.lang,
        format?.prettierOptions,
      );
    }

    return formattedCode;
  }
}
