import fs from 'fs';
import path from 'path';
import { FileCompiler } from '.';
import { CacheKey, CacheMap, FileCacheMeta, LoadedCache } from '../types';
import { CacheManager } from './cache-manager';
import { CleanupManager } from './cleanup-manager';

export class AssetManager {
  // 需要经过管线编译处理的文件类型
  pipelineFiles = ['.js', '.ts', '.less', '.scss', '.sass'];

  private skippedCount = 0;

  constructor(
    private fileCompiler: FileCompiler,
    private cleanupManager: CleanupManager,
    private cacheManager: CacheManager,
  ) {}

  /**
   * 运行资源文件处理管线
   */
  async runAsset(files: string[], cacheMap: CacheMap): Promise<number> {
    const absPaths = new Set(files.map((f) => this.fileCompiler.getAbsPath(f)));

    const cache = cacheMap[CacheKey.ASSET];

    // 基于已加载的内存缓存，清理不存在的文件对应的输出产物
    await this.cleanupManager.removeMatchedFromCache(
      CacheKey.ASSET,
      cache,
      (u) => !absPaths.has(u.file),
    );

    if (!files.length) return 0;

    // 并行拷贝所有资源文件
    const copied = await Promise.all(files.map((file) => this.processAsset(file, cache)));

    return copied.filter(Boolean).length;
  }

  /**
   * Process single asset file, compare with cache and decide whether to copy.
   */
  async processAsset(
    filePath: string,
    existingCache?: LoadedCache<FileCacheMeta>,
  ): Promise<FileCacheMeta | undefined> {
    const { fileCompiler, cacheManager } = this;

    const absPath = fileCompiler.getAbsPath(filePath);
    const fileMeta: FileCacheMeta = {
      file: absPath,
      ...(await fileCompiler.getFileMeta(absPath)),
    };

    // 加载缓存
    const cache =
      (fileCompiler.getIsCache() ? existingCache : undefined) ||
      (await cacheManager.loadCache(CacheKey.ASSET));

    // 查找缓存记录
    const record = cache.target.find((f) => f.file === absPath);

    // 如果元数据（大小、时间）未变，跳过拷贝
    if (record && fileCompiler.compareFileMeta(record, fileMeta)) {
      this.skippedCount++;
      return;
    }

    // 计算输出路径并执行拷贝
    const outputPath = fileCompiler.resolveOutputPath(absPath);

    await fs.promises.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.promises.copyFile(absPath, outputPath);

    // 添加到待更新队列
    this.updateCache(absPath, fileMeta, cache);

    // fix: watch 场景直接调用 processAsset 时，当前文件需要立即落盘缓存
    if (fileCompiler.getIsCache() && !existingCache) {
      await cacheManager.saveCache(cache);
    }

    return fileMeta;
  }

  /**
   * 更新缓存
   */
  private updateCache(
    targetFile: string,
    newData: FileCacheMeta,
    cache?: LoadedCache<FileCacheMeta>,
  ) {
    if (!cache) return;

    const index = cache.target.findIndex((c) => c.file === targetFile);

    // 更新缓存单元
    if (index > -1) {
      cache.target[index] = newData;
    } else {
      cache.target.push(newData);
    }
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
