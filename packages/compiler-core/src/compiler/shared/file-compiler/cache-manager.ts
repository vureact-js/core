import { FileCompiler } from '.';
import { CacheKey, ScriptUnit, SFCUnit } from '../types';

export class CacheManager {
  constructor(private fileCompiler: FileCompiler) {}

  /**
   * 增量更新缓存记录
   */
  async updateCacheIncrementally(unit: SFCUnit | ScriptUnit, key: CacheKey) {
    if (!this.fileCompiler.getIsCache()) return;

    const cache = await this.fileCompiler.loadCache(key);
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
    await this.fileCompiler.saveCache(cache);
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
