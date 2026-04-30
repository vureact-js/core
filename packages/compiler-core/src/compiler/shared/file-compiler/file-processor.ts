import { RUNTIME_PACKAGES } from '@consts/other';
import { normalizePath } from '@shared/path';
import fs from 'fs';
import kleur from 'kleur';
import path from 'path';
import { FileCompiler } from '.';
import {
  CacheKey,
  CacheMeta,
  CompilationUnit,
  FileCacheMeta,
  LoadedCache,
  ScriptUnit,
  SFCUnit,
  StyleUnit,
  Vue2ReactCacheMeta,
} from '../types';
import { CacheManager } from './cache-manager';
import { CompilationUnitProcessor } from './compilation-unit';

interface FileScanResult {
  assets: string[];
  script: string[];
  style: string[];
  vue: string[];
}

export class FileProcessor {
  private skippedCount = 0;

  constructor(
    private fileCompiler: FileCompiler,
    private compilationUnitProcessor: CompilationUnitProcessor,
    private cacheManager: CacheManager,
  ) {}

  /**
   * Process a single Vue file (this method is called directly in CLI Watch mode)
   */
  async processSFC(filePath: string, existingCache?: LoadedCache<Vue2ReactCacheMeta>) {
    return this.processFile(CacheKey.SFC, filePath, existingCache);
  }

  /**
   * Process a single script file (this method is called directly in CLI Watch mode)
   */
  async processScript(filePath: string, existingCache?: LoadedCache<FileCacheMeta>) {
    return this.processFile(CacheKey.SCRIPT, filePath, existingCache);
  }

  /**
   * Process a single style file (this method is called directly in CLI Watch mode)
   */
  async processStyle(filePath: string, existingCache?: LoadedCache<FileCacheMeta>) {
    return this.processFile(CacheKey.STYLE, filePath, existingCache);
  }

  /**
   * Process a single vue file
   */
  async processFile(
    key: CacheKey.SFC,
    filePath: string,
    existingCache?: LoadedCache<Vue2ReactCacheMeta>,
  ): Promise<SFCUnit | undefined>;

  /**
   * Process a single script file
   */
  async processFile(
    key: CacheKey.SCRIPT,
    filePath: string,
    existingCache?: LoadedCache<FileCacheMeta>,
  ): Promise<ScriptUnit | undefined>;

  /**
   * Process a single style file
   */
  async processFile(
    key: CacheKey.STYLE,
    filePath: string,
    existingCache?: LoadedCache<FileCacheMeta>,
  ): Promise<StyleUnit | undefined>;

  /**
   * Process a single vue/script/style file
   */
  async processFile(
    key: CacheKey,
    filePath: string,
    existingCache?: LoadedCache<FileCacheMeta>,
  ): Promise<CompilationUnit | undefined>;

  async processFile(
    key: CacheKey.SFC | CacheKey.SCRIPT | CacheKey.STYLE,
    filePath: string,
    existingCache?: LoadedCache,
  ): Promise<CompilationUnit | undefined> {
    const absPath = this.fileCompiler.getAbsPath(filePath);

    // 1. 获取最新元数据
    const fileMeta = await this.fileCompiler.getFileMeta(absPath);

    // 2. 校验缓存
    const cache =
      (this.fileCompiler.getIsCache() ? existingCache : undefined) ||
      (await this.cacheManager.loadCache(key));

    // 查找缓存记录
    const record = cache?.target.find((c: CacheMeta) => c.file === absPath);

    const { shouldCompile, hash } = await this.fileCompiler.checkCacheStatus(fileMeta, record, () =>
      fs.promises.readFile(absPath, 'utf-8'),
    );

    // 跳过未修改的文件
    if (!shouldCompile) {
      this.skippedCount++;
      return;
    }

    // 3. 编译
    const source = await fs.promises.readFile(absPath, 'utf-8');
    if (!source.trim()) return;

    // 初始化编译单元
    const initUnit: CompilationUnit = {
      ...fileMeta,
      source,
      type: key,
      fileId: '',
      file: absPath,
      output: undefined,
      hash: hash || this.fileCompiler.genHash(source),
    };

    // 4. 执行流水线
    const processed = await this.compilationUnitProcessor.resolve(initUnit, key);

    // 5. 产物落地与缓存同步
    if (processed?.output) {
      await this.compilationUnitProcessor.saveCompiledFiles(processed, key);

      // 只有 sfc / script 文件存在时，才需要执行注入逻辑
      if (key === CacheKey.SFC || key === CacheKey.SCRIPT) {
        if ((processed as SFCUnit)?.hasRoute) {
          await this.addRouterToPackageJson();
          await this.updateEntryWithRouterProvider();
        }
      }

      await this.cacheManager.updateCacheIncrementally(processed, key);
    }

    return processed;
  }

  /**
   * 对 package.json 注入路由依赖项
   */
  private async addRouterToPackageJson() {
    const { output } = this.fileCompiler.options;

    // fix: 未初始化 Vite 时，输出目录通常不存在 package.json，跳过依赖注入
    if (output?.bootstrapVite === false) {
      return;
    }

    const { router } = RUNTIME_PACKAGES;
    const filePath = this.fileCompiler.getOutputPkgPath();
    const packageJson = await this.fileCompiler.resolvePackageFile(filePath);

    // 如果已经包含路由依赖，则跳过
    if (packageJson?.dependencies?.[router.name]) {
      return;
    }

    // 确保 dependencies 存在
    if (!packageJson.dependencies) {
      packageJson.dependencies = {};
    }

    // 注入依赖
    packageJson.dependencies[router.name] = router.version;

    const newData = JSON.stringify(packageJson, null, 2);

    await this.fileCompiler.writeFileWithDir(filePath, newData, {
      lock: true,
    });
  }

  /**
   * 注入路由提供器到 React 应用的入口文件（如 main.tsx）
   */
  private async updateEntryWithRouterProvider() {
    const { exclude, output, router } = this.fileCompiler.options;
    const inputPath = this.fileCompiler.getInputPath();
    const outputPath = this.fileCompiler.getOuputPath(true);

    // 如果没有启用 bootstrapVite，则无法静态确定入口文件及其内容
    if (
      output?.bootstrapVite === false ||
      router?.autoUpdateEntry === false ||
      !router?.configFile
    ) {
      return;
    }

    // 读取输出目录的 main.(jsx|tsx) 文件内容
    const getMainFile = async (filename: string) => {
      const filePath = path.resolve(outputPath, filename);

      try {
        return { filePath, content: await fs.promises.readFile(filePath, 'utf-8') };
      } catch {
        return;
      }
    };

    const fileData = (await getMainFile('main.tsx')) || (await getMainFile('main.jsx'));

    // 确保入口文件是预期的
    if (!fileData) {
      console.warn(
        `${kleur.yellow('⚠️')}  React application entry file not found, please confirm the filename is main.tsx or main.jsx?`,
      );
      return;
    }

    const prepareRouterEntry = () => {
      const importPath = this.fileCompiler.resolveRelativePath(inputPath, router.configFile);

      let content = fileData.content;

      // 如果排除项存在该文件路径则处理
      if (exclude?.includes(router.configFile) || exclude?.includes(importPath)) {
        return content;
      }

      const routerModule = 'RouterInstance';

      // 检查是否已经导入了 RouterInstance
      if (content.includes(routerModule) || content.includes(importPath)) {
        // 已经导入过了，直接返回处理过的内容
        return content;
      }

      const routerImport = `import ${routerModule} from '${importPath}'`;

      // 查找并替换 App 为 RouterInstance 导入
      if (content.includes('./App')) {
        const appImportRegex = /import\s+(?:App|.*)\s+from\s+['"]\.\/App\.(?:tsx|jsx)['"]/;
        content = content.replace(appImportRegex, routerImport);
      } else {
        // 如果没有找到 App 导入，在合适的位置插入 router 导入
        const lastImportMatch = content.match(/import.*from.*\n/g);

        if (lastImportMatch) {
          const lastImport = lastImportMatch.pop()!;
          content = content.replace(lastImport, `${lastImport}\n${routerImport}`);
        } else {
          content = `${routerImport}${content}`;
        }
      }

      // 替换 App 组件为路由提供器组件
      const providerTag = `<${routerModule}.RouterProvider />`;
      fileData.content = content.replace(/<App\s*\/?>/g, providerTag);
    };

    prepareRouterEntry();

    // 替换 main 文件内容
    await this.fileCompiler.writeFileWithDir(fileData.filePath, fileData.content);
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

  /**
   * 扫描项目中的编译文件和资产文件
   * @param recursive 是否递归扫描子目录
   * @param ignoreAssets 需要忽略的资产文件列表
   */
  scanFiles(): FileScanResult {
    const { fileCompiler } = this;

    const rootPath = fileCompiler.getProjectRoot();
    const inputPath = fileCompiler.getInputPath();

    const scriptExt = /\.(js|ts|jsx|tsx)$/i;
    const styleExt = /\.(css|less|sass|scss)$/i;

    const result: FileScanResult = {
      assets: [],
      script: [],
      style: [],
      vue: [],
    };

    const getInputStat = (path: string): fs.Stats | undefined => {
      if (!fs.existsSync(path)) return;
      return fs.statSync(path);
    };

    const resolveDirectory = (
      file: string,
      walk: (path: string) => void,
      fallback: (path: string) => void,
    ) => {
      const directory = fs.readdirSync(file);

      directory.forEach((p) => {
        // 拼接文件的完整路径
        const fullPath = path.resolve(file, p);
        if (fileCompiler.shouldSkipPath(fullPath)) {
          return;
        }

        const stat = fs.statSync(fullPath);
        if (stat.isDirectory() && fileCompiler.options.recursive !== false) {
          walk(fullPath);
          return;
        }

        fallback(fullPath);
      });
    };

    // 扫描待编译文件
    const scanCompilationFiles = (file: string, res: FileScanResult) => {
      const stat = getInputStat(file);
      if (!stat) return;

      // 文件分类
      const classifyFile = (filePath: string) => {
        const fileExt = path.extname(filePath);

        if (fileExt === '.vue') {
          res.vue.push(filePath);
          return;
        }

        if (scriptExt.test(fileExt)) {
          res.script.push(filePath);
          return;
        }

        if (styleExt.test(fileExt)) {
          res.style.push(filePath);
        }
      };

      // 单独文件直接进分类列表
      if (stat.isFile()) {
        classifyFile(file);
        return;
      }

      // 处理文件目录
      resolveDirectory(
        file,
        (path) => scanCompilationFiles(path, res),
        (path) => classifyFile(path),
      );
    };

    /**
     * 判断单个文件是否可以归类为资产文件
     */
    const isAssetFile = (input: string): boolean => {
      const fileExt = path.extname(input).toLowerCase();
      const resolvedPath = normalizePath(fileCompiler.relativePath(input));
      const baseName = path.basename(input).toLowerCase();
      const exclusions = fileCompiler.getIgnoreAssets();

      // 规则 A: 排除预设的冲突文件（适用于所有目录）
      if (!fileCompiler.options.output?.ignoreAssets) {
        // 检查完整相对路径或文件名是否匹配预设排除模式
        const shouldExclude = Array.from(exclusions).some((pattern) => {
          // 如果模式以点结尾（如 'tsconfig.'），检查文件名是否以该模式开头
          if (pattern.endsWith('.')) {
            return baseName.startsWith(pattern);
          }

          // 直接检查文件扩展名是否匹配
          if (pattern.startsWith('.')) {
            return fileExt === pattern;
          }

          // 否则检查完整相对路径或文件名是否完全匹配
          return resolvedPath === pattern || baseName === pattern;
        });

        if (shouldExclude) return false;
      } else {
        // 规则 B: 如果指定了 ignoreAssets 则由用户控制
        // 规则 C: Vue 文件全部封杀，绝对不作为 Asset 拷贝
        if (exclusions.has(resolvedPath) || exclusions.has(baseName) || fileExt === '.vue') {
          return false;
        }
      }

      // 规则 D: 智能区分 src 目录与项目配置文件
      const isInsideSrc = input.startsWith(inputPath + path.sep);

      // 在 src 里面的 js/ts/less 等归编译管线处理，这里不拷贝
      if (isInsideSrc && (scriptExt.test(fileExt) || styleExt.test(fileExt))) {
        return false;
      }

      return true;
    };

    // 扫描资产文件
    const scanAssetFiles = (input: string, res: FileScanResult) => {
      const stat = getInputStat(input);

      if (!stat || fileCompiler.shouldSkipPath(input)) {
        return;
      }

      if (stat.isFile()) {
        if (isAssetFile(input)) {
          res.assets.push(input);
        }
        return;
      }

      // 处理文件目录
      resolveDirectory(
        input,
        (path) => scanAssetFiles(path, res),
        (path) => {
          if (isAssetFile(path)) {
            res.assets.push(path);
          }
        },
      );
    };

    // 执行文件扫描
    scanCompilationFiles(inputPath, result);
    scanAssetFiles(rootPath, result);

    return result;
  }
}
