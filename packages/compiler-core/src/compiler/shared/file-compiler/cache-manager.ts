import fs from 'fs';
import { FileCompiler } from '.';
import { fileLock } from '../file-lock-manager';
import {
  CacheKey,
  CacheList,
  CacheMap,
  CompilationUnit,
  LoadedCache,
  ScriptUnit,
  SFCUnit,
  StyleUnit,
} from '../types';

export class CacheManager {
  private pendingUpdates: Map<CacheKey, Array<{ unit: CompilationUnit; meta: any }>> = new Map();
  /** 缓存文件仅读取一次，之后复用此副本 */
  private cachedData: CacheList | null = null;

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
   * 一次性刷新所有缓存（只写一次文件）
   */
  async flushAllCache() {
    if (!this.fileCompiler.getIsCache()) {
      return;
    }

    const keys = Object.values(CacheKey);

    if (!this.cachedData) {
      await this.loadAllCache();
    }

    for (const key of keys) {
      const updates = this.pendingUpdates.get(key);

      if (!updates?.length) continue;

      const activeFiles = new Set(updates.map((u) => u.unit.file));

      const entries = (this.cachedData![key] || []).filter((c) => activeFiles.has(c.file));

      updates.forEach(({ unit, meta }) => {
        const idx = entries.findIndex((c) => c.file === unit.file);
        if (idx > -1) {
          entries[idx] = meta;
        } else {
          entries.push(meta);
        }
      });

      this.cachedData![key] = entries as any[];
      this.pendingUpdates.set(key, []);
    }

    // 一次性写入磁盘
    await fileLock.updateFile(this.fileCompiler.getCachePath(), () => this.cachedData!);
  }

  /**
   * 一次性加载所有缓存（只读一次文件）
   */
  async loadAllCache(): Promise<CacheMap> {
    const filePath = this.fileCompiler.getCachePath();
    const result = {} as CacheMap;

    let raw: CacheList | null = null;

    if (fs.existsSync(filePath)) {
      try {
        const content = await fs.promises.readFile(filePath, 'utf-8');
        raw = JSON.parse(content) as CacheList;
      } catch {
        // 解析失败使用空数据
      }
    }

    this.cachedData = raw || this.getEmptyList();

    const keys = Object.values(CacheKey);
    for (const key of keys) {
      result[key] = this.buildLoadedCache(key, raw);
    }

    return result;
  }

  /**
   * 加载指定类型的缓存（watch 等场景使用）
   */
  async loadCache(key: CacheKey): Promise<LoadedCache> {
    // 如果已加载全部缓存，直接从中提取
    if (this.cachedData) {
      return this.buildLoadedCache(key, this.cachedData);
    }

    // 否则从磁盘读取
    const filePath = this.fileCompiler.getCachePath();
    if (fs.existsSync(filePath)) {
      try {
        const content = await fs.promises.readFile(filePath, 'utf-8');
        const data = JSON.parse(content) as CacheList;
        return this.buildLoadedCache(key, data);
      } catch {
        // ignore
      }
    }

    return this.buildLoadedCache(key, null);
  }

  /**
   * 刷新指定 key 的缓存（统一由 flushAllCache 写入，此方法仅用于外部兼容调用）
   */
  async flushCache(key: CacheKey) {
    // 单 key flush 仅做记录，由 flushAllCache 统一写入
    // 但如果 flushAllCache 从未调用，需要单独写入
    if (!this.fileCompiler.getIsCache()) return;
    if (!this.pendingUpdates.has(key)) return;

    const updates = this.pendingUpdates.get(key)!;
    if (!updates.length) return;

    // 确保 cachedData 已加载
    if (!this.cachedData) {
      // 直接读文件
      const filePath = this.fileCompiler.getCachePath();
      if (fs.existsSync(filePath)) {
        try {
          const content = await fs.promises.readFile(filePath, 'utf-8');
          this.cachedData = JSON.parse(content);
        } catch {
          // ignore
        }
      }
    }

    // 合并待更新数据到 cachedData
    const activeFiles = new Set(updates.map((u) => u.unit.file));
    let entries = (this.cachedData || this.getEmptyList())[key] || [];
    entries = entries.filter((c: any) => activeFiles.has(c.file));

    updates.forEach(({ unit, meta }) => {
      const idx = entries.findIndex((c: any) => c.file === unit.file);
      if (idx > -1) {
        entries[idx] = meta;
      } else {
        entries.push(meta);
      }
    });

    // @ts-ignore
    (this.cachedData || this.getEmptyList())[key] = entries;
    this.pendingUpdates.set(key, []);

    // 单 key 立即写盘
    await this.saveCache(this.buildLoadedCache(key, this.cachedData));
  }

  private getEmptyList(): CacheList {
    return {
      [CacheKey.SFC]: [],
      [CacheKey.SCRIPT]: [],
      [CacheKey.STYLE]: [],
      [CacheKey.ASSET]: [],
    };
  }

  /**
   * 保存缓存数据到文件（watch 等场景使用）
   */
  async saveCache(data: LoadedCache) {
    if (!this.fileCompiler.getIsCache() || !data) return;

    // 同步到 cachedData
    if (this.cachedData) {
      this.cachedData[data.key] = data.target as any[];
    }

    await fileLock.updateFile(this.fileCompiler.getCachePath(), (currentData: CacheList | null) => {
      const merged = currentData || this.getEmptyList();
      merged[data.key] = data.target as any[];
      return merged;
    });
  }

  private buildLoadedCache(key: CacheKey, raw: CacheList | null): LoadedCache {
    const emptySource: CacheList = {
      [CacheKey.SFC]: [],
      [CacheKey.SCRIPT]: [],
      [CacheKey.STYLE]: [],
      [CacheKey.ASSET]: [],
    };

    const source = raw || emptySource;

    return {
      key,
      target: source[key] || [],
      source,
    };
  }
}
