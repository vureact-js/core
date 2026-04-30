import path from 'path';
import { FileCompiler } from '.';
import {
  CacheKey,
  CacheMeta,
  LoadedCache,
  ScriptCacheMeta,
  StyleCacheMeta,
  Vue2ReactCacheMeta,
} from '../types';
import { CacheManager } from './cache-manager';

export class CleanupManager {
  constructor(
    private fileCompiler: FileCompiler,
    private cacheManager: CacheManager,
  ) {}

  /**
   * 删除指定路径对应的构建产物和缓存
   */
  async removeOutputPath(targetPath: string, type: CacheKey) {
    const absPath = this.fileCompiler.getAbsPath(targetPath);
    const cache = await this.cacheManager.loadCache(type);

    // 查找匹配条目：路径完全相等，或者是该路径下的子文件
    await this.removeMatchedFromCache(type, cache, (m) => {
      // 加 path.sep 是因为假如删除了 src/components 文件夹，
      // 为了防止误删名为 src/components-old 的文件夹，
      // 所以必须确保路径后跟着一个分隔符，确保精准匹配子目录内容。
      return m.file === absPath || m.file.startsWith(absPath + path.sep);
    });

    await this.cacheManager.saveCache(cache);
  }

  /**
   * 删除匹配的输出文件，并从内存缓存中移除对应条目（不写磁盘）
   */
  async removeMatchedFromCache(
    key: CacheKey,
    cache: LoadedCache,
    filter: (m: CacheMeta) => boolean,
  ) {
    if (!cache.target.length) return;

    const toRemove = cache.target.filter(filter);
    if (!toRemove.length) return;

    await Promise.all(toRemove.map((m) => this.removeCacheMeta(key, m)));

    // 从内存缓存中移除已删除的条目
    const removedFiles = new Set(toRemove.map((m) => m.file));
    cache.target = cache.target.filter((m: any) => !removedFiles.has(m.file));
  }

  /**
   * 删除单个缓存元数据对应的输出文件（不操作缓存）
   */
  async removeCacheMeta(key: CacheKey, meta: CacheMeta): Promise<void> {
    switch (key) {
      case CacheKey.SFC: {
        const sfcMeta = meta as Vue2ReactCacheMeta;
        const { jsx, css } = sfcMeta.output!;
        await this.fileCompiler.removeOutputFile(jsx.file);
        if (css?.file) {
          await this.fileCompiler.removeOutputFile(css.file);
        }
        break;
      }

      case CacheKey.SCRIPT: {
        const scriptMeta = meta as ScriptCacheMeta;
        await this.fileCompiler.removeOutputFile(scriptMeta.output!.script.file);
        break;
      }

      case CacheKey.STYLE: {
        const styleMeta = meta as StyleCacheMeta;
        await this.fileCompiler.removeOutputFile(styleMeta.output!.style.file);
        break;
      }

      // 静态资产缓存直接删除对应文件
      default: {
        await this.fileCompiler.removeOutputFile(meta.file, true);
        break;
      }
    }
  }
}
