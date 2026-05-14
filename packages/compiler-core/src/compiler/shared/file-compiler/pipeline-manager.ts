import { FileCompiler } from '.';
import { CacheKey, CacheMap } from '../types';
import { CleanupManager } from './cleanup-manager';
import { FileProcessor } from './file-processor';

export class PipelineManager {
  private skippedCount = 0;

  constructor(
    private fileCompiler: FileCompiler,
    private fileProcessor: FileProcessor,
    private cleanupManager: CleanupManager,
  ) {}

  /**
   * 运行 SFC 编译管线
   */
  async runSFC(files: string[], cacheMap: CacheMap): Promise<number> {
    return this.runCore(files, CacheKey.SFC, cacheMap);
  }

  /**
   * 运行 Script 编译管线
   */
  async runScript(files: string[], cacheMap: CacheMap): Promise<number> {
    return this.runCore(files, CacheKey.SCRIPT, cacheMap);
  }

  /**
   * 运行 Style 编译管线
   */
  async runStyle(files: string[], cacheMap: CacheMap): Promise<number> {
    return this.runCore(files, CacheKey.STYLE, cacheMap);
  }

  /**
   * 核心编译管线
   */
  private async runCore(
    files: string[],
    key: CacheKey.SFC | CacheKey.SCRIPT | CacheKey.STYLE,
    cacheMap: CacheMap,
  ): Promise<number> {
    // 将传入的文件路径转换为绝对路径并存储到 Set 中，
    // 用于后续清理时判断文件是否存在
    const absPaths = new Set(files.map((f) => this.fileCompiler.getAbsPath(f)));

    const cache = cacheMap[key];

    // 基于已加载的内存缓存，清理不存在的文件对应的输出产物
    // 直接从内存 cache 中移除条目，不同步写磁盘（flushCache 时会统一写回）
    await this.cleanupManager.removeMatchedFromCache(key, cache, (c: any) => !absPaths.has(c.file));

    if (!files.length) return 0;

    // 使用 Promise.all 并行编译
    const compiled = await Promise.all(
      files.map((f) => this.fileProcessor.processFile(key, f, cache)),
    );

    return compiled.filter(Boolean).length;
  }

  /**
   * 获取跳过的文件数量
   */
  getSkippedCount(): number {
    return (this.skippedCount += this.fileProcessor.getSkippedCount());
  }

  /**
   * 重置跳过的文件数量
   */
  resetSkippedCount(): void {
    this.skippedCount = 0;
    this.fileProcessor.resetSkippedCount();
  }
}
