import path from 'path';
import { FileCompiler } from '.';
import { CacheKey } from '../types';
import { CleanupManager } from './cleanup-manager';
import { FileProcessor } from './file-processor';

export class PipelineManager {
  private skippedCount = 0;
  private cleanupManager: CleanupManager;

  constructor(
    private fileCompiler: FileCompiler,
    private fileProcessor: FileProcessor,
  ) {
    this.cleanupManager = new CleanupManager(fileCompiler);
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
   * 运行 Style 编译管线
   */
  async runStylePipeline(): Promise<number> {
    return this.runCorePipeline(CacheKey.STYLE);
  }
  /**
   * 核心编译管线
   */
  private async runCorePipeline(
    key: CacheKey.SFC | CacheKey.SCRIPT | CacheKey.STYLE,
  ): Promise<number> {
    const inputPath = this.fileCompiler.getInputPath();

    const scriptExtRegex = /\.(js|ts)$/i;
    const styleExtRegex = /\.(css|less|sass|scss)$/i;

    const files = this.fileCompiler.scanFiles(inputPath, (p) => {
      const ext = path.extname(p);

      if (key === CacheKey.SFC) {
        return ext === '.vue';
      }

      if (key === CacheKey.SCRIPT) {
        return scriptExtRegex.test(ext);
      }

      if (key === CacheKey.STYLE) {
        return styleExtRegex.test(ext);
      }

      return false;
    });

    // 加载缓存
    const absFiles = new Set(files.map((f) => this.fileCompiler.getAbsPath(f)));

    // fix: 即使当前类型已无文件，也需要清理历史产物与缓存
    await this.cleanupManager.cleanupOldOutput(key, (c: any) => !absFiles.has(c.file));

    if (!files.length) return 0;

    // fix: 在清理后重新加载缓存，避免把已删除条目写回
    const cache = await this.fileCompiler.loadCache(key);

    // 使用 Promise.all 并行编译
    const compiled = await Promise.all(
      files.map(async (f) => this.fileProcessor.processFile(key, f, cache)),
    );

    // 批量保存缓存
    await this.fileCompiler.flushCache(key);

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
  }
}
