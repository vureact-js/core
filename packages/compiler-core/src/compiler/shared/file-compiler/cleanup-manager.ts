import path from 'path';
import { FileCompiler } from '.';
import { CacheKey, CacheMeta, Vue2ReactCacheMeta } from '../types';

export class CleanupManager {
  constructor(private fileCompiler: FileCompiler) {}

  /**
   * Delete the build artifacts and cache corresponding to the specified path.
   */
  async removeOutputPath(targetPath: string, type: CacheKey) {
    const absPath = this.fileCompiler.getAbsPath(targetPath);
    await this.cleanupOldOutput(
      type,
      (u) =>
        u.file === absPath ||
        // 加 path.sep 是因为假如删除了 src/components 文件夹，
        // 为了防止误删名为 src/components-old 的文件夹，
        // 所以必须确保路径后跟着一个分隔符，确保精准匹配子目录内容。
        u.file.startsWith(absPath + path.sep),
    );
  }

  /**
   * Delete the build artifacts or asset files and cache corresponding to the specified path.
   */
  async cleanupOldOutput(key: CacheKey, filter: (m: CacheMeta) => boolean) {
    const cache = await this.fileCompiler.loadCache(key as any);
    if (!cache.target.length) return;

    // 查找匹配条目：路径完全相等，或者是该路径下的子文件
    const toRemove = cache.target.filter(filter);
    if (!toRemove.length) return;

    const removeFn = async (m: CacheMeta) => {
      if (key === CacheKey.SFC) {
        const meta = m as Vue2ReactCacheMeta;
        if (!meta?.output) return;

        // 删除对应 jsx / css 文件
        const { jsx, css } = meta.output;
        await this.fileCompiler.removeOutputFile(jsx.file);

        if (css?.file) {
          await this.fileCompiler.removeOutputFile(css.file);
        }
      } else if (key === CacheKey.SCRIPT || key === CacheKey.ASSET) {
        // 普通缓存直接删除对应文件
        await this.fileCompiler.removeOutputFile(m.file, true);
      }
    };

    await Promise.all(toRemove.map(removeFn));
    await this.fileCompiler.saveCache(cache);
  }
}
