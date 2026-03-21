import { FileCompiler } from '.';
import { CacheKey, CompilationUnit, LoadedCache, ScriptUnit, SFCUnit, StyleUnit } from '../types';

export class CacheManager {
  private pendingUpdates: Map<CacheKey, Array<{ unit: CompilationUnit; meta: any }>> = new Map();

  constructor(private fileCompiler: FileCompiler) {}

  /**
   * 批量更新缓存记录
   */
  async updateCacheIncrementally(unit: CompilationUnit, key: CacheKey) {
    if (!this.fileCompiler.getIsCache()) return;

    // 准备缓存元数据
    const meta = { ...unit };

    // 缓存不存源码和输出内容
    delete (meta as any).source;

    if (key === CacheKey.SFC) {
      // @ts-ignore
      delete (meta as SFCUnit).output?.jsx.code;
      delete (meta as SFCUnit).output?.css.code;
    } else if (key === CacheKey.SCRIPT) {
      // @ts-ignore
      delete (meta as ScriptUnit).output?.script.code;
    } else if (key === CacheKey.STYLE) {
      // @ts-ignore fix: 不存储 style 源码
      delete (meta as StyleUnit).output?.style.code;
    }

    // 添加到待更新队列
    if (!this.pendingUpdates.has(key)) {
      this.pendingUpdates.set(key, []);
    }
    this.pendingUpdates.get(key)!.push({ unit, meta });
  }

  /**
   * 批量保存缓存
   */
  async flushCache(key: CacheKey) {
    // 不处理未启用缓存或不在待更新中
    if (!this.fileCompiler.getIsCache() || !this.pendingUpdates.has(key)) {
      return;
    }

    const updates = this.pendingUpdates.get(key)!;
    if (updates.length === 0) return;

    // 加载当前缓存
    const cache = await this.fileCompiler.loadCache(key);

    // 批量更新缓存
    for (const { unit, meta } of updates) {
      this.updateCache(unit.file, meta, cache);
    }

    // 保存缓存（saveCache 内部已经使用文件锁）
    await this.fileCompiler.saveCache(cache);

    // 清空待更新队列
    this.pendingUpdates.set(key, []);
  }

  /**
   * 更新缓存
   */
  private updateCache(targetFile: string, newData: any, cache: LoadedCache) {
    const index = cache.target.findIndex((c: any) => c.file === targetFile);

    // 更新缓存单元
    if (index > -1) {
      cache.target[index] = newData;
    } else {
      cache.target.push(newData);
    }
  }
}
