import path from 'path';
import { FileCompiler } from '.';
import { CacheKey, CacheMeta, ScriptCacheMeta, StyleCacheMeta, Vue2ReactCacheMeta } from '../types';

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
      let meta;

      switch (key) {
        case CacheKey.SFC: {
          meta = m as Vue2ReactCacheMeta;

          // 删除对应 jsx 产物
          const { jsx, css } = meta.output!;
          await this.fileCompiler.removeOutputFile(jsx.file);

          // 删除对应 style 产物
          if (css?.file) {
            await this.fileCompiler.removeOutputFile(css.file);
          }

          break;
        }

        case CacheKey.SCRIPT: {
          meta = m as ScriptCacheMeta;
          await this.fileCompiler.removeOutputFile(meta.output!.script.file);
          break;
        }

        case CacheKey.STYLE: {
          meta = m as StyleCacheMeta;
          await this.fileCompiler.removeOutputFile(meta.output!.style.file);
          break;
        }

        // 静态资产缓存直接删除对应文件
        default: {
          await this.fileCompiler.removeOutputFile(m.file, true);
          break;
        }
      }
    };

    // 并行删除
    await Promise.all(toRemove.map(removeFn));

    // 更新缓存
    const removedFiles = new Set(toRemove.map((m) => m.file));

    cache.target = cache.target.filter((m) => !removedFiles.has(m.file));

    await this.fileCompiler.saveCache(cache);
  }
}
