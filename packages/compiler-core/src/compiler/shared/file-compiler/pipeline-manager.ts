import path from 'path';
import { Helper } from '../helper';
import {
  CacheKey,
  CompilerOptions,
  FileCacheMeta,
  LoadedCache,
  Vue2ReactCacheMeta,
} from '../types';
import { CleanupManager } from './cleanup-manager';
import { FileProcessor } from './file-processor';

export class PipelineManager {
  private skippedCount = 0;
  private cleanupManager: CleanupManager;

  constructor(
    private helper: Helper,
    private options: CompilerOptions,
    private fileProcessor: FileProcessor,
  ) {
    this.cleanupManager = new CleanupManager(helper);
  }

  /**
   * 运行 SFC 编译管线
   */
  async runSfcPipeline(): Promise<number> {
    return this.runCorePipeline(CacheKey.SFC);
  }

  /**
   * 运行 Script 编译管线
   */
  async runScriptPipeline(): Promise<number> {
    return this.runCorePipeline(CacheKey.SCRIPT);
  }

  /**
   * 核心编译管线
   */
  private async runCorePipeline(key: CacheKey.SFC | CacheKey.SCRIPT): Promise<number> {
    const inputPath = this.helper.getInputPath();

    const files = this.helper.scanFiles(inputPath, (p) => {
      const ext = path.extname(p);
      if (key === CacheKey.SFC) return ext === '.vue';
      if (key === CacheKey.SCRIPT) return ext === '.js' || ext === '.ts';
      return false;
    });

    if (!files.length) return 0;

    // 加载缓存
    const cache = await this.helper.loadCache(key);
    const absFiles = new Set(files.map((f) => this.helper.getAbsPath(f)));

    // 清理旧输出文件
    await this.cleanupManager.cleanupOldOutput(key, (c: any) => !absFiles.has(c.file));

    const results = await Promise.all(
      files.map(async (f) => {
        // 根据 key 的类型传递正确的缓存类型
        if (key === CacheKey.SFC) {
          return this.fileProcessor.processFile(key, f, cache as LoadedCache<Vue2ReactCacheMeta>);
        } else {
          return this.fileProcessor.processFile(key, f, cache as LoadedCache<FileCacheMeta>);
        }
      }),
    );

    const compiledCount = results.filter(Boolean).length;
    this.skippedCount += files.length - compiledCount;

    return compiledCount;
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
}
