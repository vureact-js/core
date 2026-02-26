import fs from 'fs';
import { Helper } from '../helper';
import {
  CacheKey,
  CacheMeta,
  CompilerOptions,
  FileCacheMeta,
  LoadedCache,
  ScriptUnit,
  SFCUnit,
  Vue2ReactCacheMeta,
} from '../types';
import { CacheManager } from './cache-manager';
import { CompilationUnitProcessor } from './compilation-unit';

export class FileProcessor {
  constructor(
    private helper: Helper,
    private options: CompilerOptions,
    private compilationUnitProcessor: CompilationUnitProcessor,
    private cacheManager: CacheManager,
  ) {}

  /**
   * Process a single Vue file (this method is called directly in CLI Watch mode)
   */
  async processSFC(
    filePath: string,
    existingCache?: LoadedCache<Vue2ReactCacheMeta>,
  ): Promise<SFCUnit | undefined> {
    return this.processFile(CacheKey.SFC, filePath, existingCache);
  }

  /**
   * Process a single script file (this method is called directly in CLI Watch mode)
   */
  async processScript(
    filePath: string,
    existingCache?: LoadedCache<FileCacheMeta>,
  ): Promise<ScriptUnit | undefined> {
    return this.processFile(CacheKey.SCRIPT, filePath, existingCache);
  }

  /**
   * Process a single vue or script file
   */
  async processFile(
    key: CacheKey.SFC,
    filePath: string,
    existingCache?: LoadedCache<Vue2ReactCacheMeta> | undefined,
  ): Promise<SFCUnit | undefined>;

  async processFile(
    key: CacheKey.SCRIPT,
    filePath: string,
    existingCache?: LoadedCache<FileCacheMeta> | undefined,
  ): Promise<ScriptUnit | undefined>;

  async processFile(
    key: CacheKey.SFC | CacheKey.SCRIPT,
    filePath: string,
    existingCache?: LoadedCache<FileCacheMeta> | undefined,
  ): Promise<SFCUnit | ScriptUnit | undefined>;

  async processFile(key: CacheKey, filePath: string, existingCache?: LoadedCache) {
    const absPath = this.helper.getAbsPath(filePath);

    // 1. 获取最新元数据
    const fileMeta = await this.helper.getFileMeta(absPath);

    // 2. 校验缓存

    const cache =
      (this.helper.getIsCache() ? existingCache : undefined) || (await this.helper.loadCache(key));

    // 查找缓存记录
    const record = cache?.target.find((c: CacheMeta) => c.file === absPath);

    const { shouldCompile, hash } = await this.helper.checkCacheStatus(fileMeta, record, () =>
      fs.promises.readFile(absPath, 'utf-8'),
    );

    // 跳过未修改的文件
    if (!shouldCompile) return;

    // 3. 编译
    const source = await fs.promises.readFile(absPath, 'utf-8');
    if (!source.trim()) return;

    // 初始化编译单元
    const initUnit: SFCUnit | ScriptUnit = {
      ...fileMeta,
      file: absPath,
      fileId: '',
      source,
      hash: hash || this.helper.genHash(source),
      output: null,
    };

    // 4. 执行流水线
    const processed = await this.compilationUnitProcessor.process(initUnit, key);

    // 5. 产物落地与缓存同步
    if (processed?.output) {
      await this.compilationUnitProcessor.saveCompiledFiles(processed, key);
      await this.cacheManager.updateCacheIncrementally(processed, key);
    }

    return processed;
  }
}
