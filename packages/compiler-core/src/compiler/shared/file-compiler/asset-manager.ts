import { normalizePath } from '@shared/path';
import fs from 'fs';
import path from 'path';
import { FileCompiler } from '.';
import { CacheKey, FileCacheMeta, LoadedCache } from '../types';
import { CleanupManager } from './cleanup-manager';

export class AssetManager {
  constructor(
    private fileCompiler: FileCompiler,
    private cleanupManager: CleanupManager,
  ) {}

  /**
   * 运行资源文件处理管线
   */
  async runAssetPipeline(): Promise<number> {
    const rootPath = this.fileCompiler.getProjectRoot();
    const inputPath = this.fileCompiler.getInputPath();
    const exclusions = this.fileCompiler.getIgnoreAssets();

    const assetFiles = this.fileCompiler.scanFiles(rootPath, (p) => {
      // 默认跳过跟项目无关的路径
      if (this.fileCompiler.shouldSkipPath(p)) return false;

      const relativeToRoot = normalizePath(this.fileCompiler.relativePath(p));
      const filename = path.basename(p).toLowerCase();
      const ext = path.extname(p).toLowerCase();

      if (!this.fileCompiler.options.output?.ignoreAssets) {
        // 规则 A: 排除预设的冲突文件（适用于所有目录）
        // fix: 检查完整相对路径或文件名是否匹配预设排除模式
        const shouldExclude = Array.from(exclusions).some((pattern) => {
          // 如果模式以点结尾（如 'tsconfig.'），检查文件名是否以该模式开头
          if (pattern.endsWith('.')) {
            return filename.startsWith(pattern);
          }
          // 否则检查完整相对路径或文件名是否完全匹配
          return relativeToRoot === pattern || filename === pattern;
        });

        if (shouldExclude) {
          return false;
        }
      } else if (exclusions.has(relativeToRoot) || exclusions.has(filename)) {
        // 规则 B: 如果指定了 ignoreAssets 则由用户控制
        return false;
      }

      // 规则 C: Vue 文件全网封杀，绝对不作为 Asset 拷贝
      if (ext === '.vue') return false;

      // 规则 D: 智能区分源码与配置文件
      const isInsideSrc = p.startsWith(inputPath + path.sep);
      if (isInsideSrc && (ext === '.js' || ext === '.ts')) {
        // 在 src 里面的 ts/js 归 ScriptPipeline 管，这里不拷贝
        return false;
      }
      // 如果是根目录下的 ts/js (如 tailwind.config.js)，会绕过上面的 if，作为 Asset 被安全拷贝

      return true;
    });

    // 执行拷贝逻辑
    const absFiles = new Set(assetFiles.map((f) => this.fileCompiler.getAbsPath(f)));
    const cache = await this.fileCompiler.loadCache(CacheKey.ASSET);

    await this.cleanupManager.cleanupOldOutput(CacheKey.ASSET, (u) => !absFiles.has(u.file));
    await this.updateAssetCaches(assetFiles, cache);

    return assetFiles.length;
  }

  /**
   * 更新资源文件缓存
   */
  private async updateAssetCaches(files: string[], cache?: LoadedCache<FileCacheMeta>) {
    for (const file of files) {
      const meta = await this.processAsset(file, cache);
      this.updateCache(file, meta, cache);
    }

    await this.fileCompiler.saveCache(cache);
  }

  /**
   * Process single asset file, compare with cache and decide whether to copy.
   */
  async processAsset(
    filePath: string,
    existingCache?: LoadedCache<FileCacheMeta>,
  ): Promise<FileCacheMeta> {
    const absPath = this.fileCompiler.getAbsPath(filePath);

    const fileMeta: FileCacheMeta = {
      file: absPath,
      ...(await this.fileCompiler.getFileMeta(absPath)),
    };

    // 加载缓存
    const cache =
      (this.fileCompiler.getIsCache() ? existingCache : undefined) ||
      (await this.fileCompiler.loadCache(CacheKey.ASSET));

    // 查找缓存记录
    const record = cache.target.find((f) => f.file === absPath);

    // 如果元数据（大小、时间）未变，跳过拷贝
    if (record && this.fileCompiler.compareFileMeta(record, fileMeta)) {
      return fileMeta;
    }

    // 计算输出路径并执行拷贝
    const outputPath = this.fileCompiler.resolveOutputPath(absPath);

    await fs.promises.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.promises.copyFile(absPath, outputPath);

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
}
