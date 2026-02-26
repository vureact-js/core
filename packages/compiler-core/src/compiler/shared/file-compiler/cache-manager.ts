import { Helper } from '../helper';
import { CacheKey, ScriptUnit, SFCUnit } from '../types';

export class CacheManager {
  constructor(private helper: Helper) {}

  /**
   * 增量更新缓存记录
   */
  async updateCacheIncrementally(unit: SFCUnit | ScriptUnit, key: CacheKey) {
    if (!this.helper.getIsCache()) return;

    const cache = await this.helper.loadCache(key);
    const meta = { ...unit };

    // 缓存不存源码和输出内容
    delete (meta as any).source;

    if (key === CacheKey.SFC) {
      delete (meta as any).output.jsx.code;
      delete (meta as any).output.css.code;
    } else if (key === CacheKey.SCRIPT) {
      delete (meta as any).output.script.code;
    }

    this.updateCache(unit.file, meta, cache);
    await this.helper.saveCache(cache);
  }

  /**
   * 更新缓存
   */
  private updateCache(targetFile: string, newData: any, cache: any) {
    const index = cache.target.findIndex((c: any) => c.file === targetFile);

    // 更新缓存单元
    if (index > -1) {
      cache.target[index] = newData;
    } else {
      cache.target.push(newData);
    }
  }
}
