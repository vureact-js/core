import { RUNTIME_PACKAGES } from '@consts/other';
import { getDirname } from '@shared/path';
import fs from 'fs';
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

export class FileProcessor {
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
      (await this.fileCompiler.loadCache(key));

    // 查找缓存记录
    const record = cache?.target.find((c: CacheMeta) => c.file === absPath);

    const { shouldCompile, hash } = await this.fileCompiler.checkCacheStatus(fileMeta, record, () =>
      fs.promises.readFile(absPath, 'utf-8'),
    );

    // 跳过未修改的文件
    if (!shouldCompile) return;

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
          // 对 package.json 注入路由依赖项
          await this.injectVuReactRouteDep();
          await this.copyRouteSetupNotes();
        }
      }

      await this.cacheManager.updateCacheIncrementally(processed, key);
    }

    return processed;
  }

  private async injectVuReactRouteDep() {
    const pkgPath = this.fileCompiler.getOutputPkgPath();
    const pkg = await this.fileCompiler.resolvePackageFile(pkgPath);

    // 注入依赖
    const { router } = RUNTIME_PACKAGES;
    if (!pkg['dependencies']) {
      pkg['dependencies'] = {};
    }

    pkg['dependencies'][router.name] = router.version;

    await fs.promises.writeFile(pkgPath, JSON.stringify(pkg, null, 2), 'utf-8');
  }

  /**
   * 如果使用了路由，则拷贝路由配置说明文档到输出目录根部。
   */
  private async copyRouteSetupNotes() {
    const outputDir = this.fileCompiler.getOuputPath();

    // 测试路径，以当前文件的路径为起点
    // const packageRoot = path.resolve(getDirname(import.meta.url), '../../../../');

    // 获取生产环境下的包根路径
    const packageRoot = path.resolve(getDirname(import.meta.url), '../');
    const templateDir = path.join(packageRoot, 'templates');

    if (!fs.existsSync(templateDir)) {
      return;
    }

    const files = ['route-setup-notes.md', 'route-setup-notes.zh.md'];

    // 拷贝文件
    for (const file of files) {
      const srcPath = path.join(templateDir, file);
      if (!fs.existsSync(srcPath)) continue;
      const destPath = path.join(outputDir, file);
      await fs.promises.copyFile(srcPath, destPath);
    }
  }
}
