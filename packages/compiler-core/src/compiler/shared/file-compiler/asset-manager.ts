import { normalizePath } from '@shared/path';
import fs from 'fs';
import path from 'path';
import { Helper } from '../helper';
import { CacheKey, CompilerOptions, FileCacheMeta, LoadedCache } from '../types';
import { CleanupManager } from './cleanup-manager';

export class AssetManager {
  constructor(
    private helper: Helper,
    private options: CompilerOptions,
    private cleanupManager: CleanupManager,
  ) {}

  /**
   * 运行资源文件处理管线
   */
  async runAssetPipeline(): Promise<number> {
    const rootPath = this.helper.getProjectRoot();
    const inputPath = this.helper.getInputPath();
    const exclusions = this.helper.getIgnoreAssets();

    const assetFiles = this.helper.scanFiles(rootPath, (p) => {
      // 默认跳过跟项目无关的路径
      if (this.helper.shouldSkipPath(p)) return false;

      const relativeToRoot = normalizePath(this.helper.relativePath(p));
      const filename = path.basename(p).toLowerCase();
      const ext = path.extname(p).toLowerCase();

      if (!this.options.output?.ignoreAssets) {
        // 规则 A: 排除模板冲突文件 (仅限根目录的同名文件)
        if (!relativeToRoot.includes(path.sep) && exclusions.has(filename)) {
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
    const absFiles = new Set(assetFiles.map((f) => this.helper.getAbsPath(f)));
    const cache = await this.helper.loadCache(CacheKey.ASSET);

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

    await this.helper.saveCache(cache);
  }

  /**
   * Process single asset file, compare with cache and decide whether to copy.
   */
  async processAsset(
    filePath: string,
    existingCache?: LoadedCache<FileCacheMeta>,
  ): Promise<FileCacheMeta> {
    const absPath = this.helper.getAbsPath(filePath);

    const fileMeta: FileCacheMeta = {
      file: absPath,
      ...(await this.helper.getFileMeta(absPath)),
    };

    // 加载缓存
    const cache =
      (this.helper.getIsCache() ? existingCache : undefined) ||
      (await this.helper.loadCache(CacheKey.ASSET));

    // 查找缓存记录
    const record = cache.target.find((f) => f.file === absPath);

    // 如果元数据（大小、时间）未变，跳过拷贝
    if (record && this.helper.compareFileMeta(record, fileMeta)) {
      return fileMeta;
    }

    // 计算输出路径并执行拷贝
    const outputPath = this.helper.resolveOutputPath(absPath);

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
