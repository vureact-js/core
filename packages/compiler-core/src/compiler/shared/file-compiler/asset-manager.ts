import { normalizePath } from '@shared/path';
import fs from 'fs';
import path from 'path';
import { FileCompiler } from '.';
import { CacheKey, FileCacheMeta, LoadedCache } from '../types';
import { CleanupManager } from './cleanup-manager';

export class AssetManager {
  // 需要经过管线编译处理的文件类型
  pipelineFiles = ['.js', '.ts', '.less', '.scss', '.sass'];

  private skippedCount = 0;

  constructor(
    private fileCompiler: FileCompiler,
    private cleanupManager: CleanupManager,
  ) {}

  /**
   * 运行资源文件处理管线
   */
  async runAssetPipeline(): Promise<number> {
    const { options } = this.fileCompiler;

    const rootPath = this.fileCompiler.getProjectRoot();
    const inputPath = this.fileCompiler.getInputPath();
    const exclusions = this.fileCompiler.getIgnoreAssets();

    const assetFiles = this.fileCompiler.scanFiles(rootPath, (p) => {
      // 默认跳过跟项目无关的路径
      if (this.fileCompiler.shouldSkipPath(p)) return false;

      const relativeToRoot = normalizePath(this.fileCompiler.relativePath(p));
      const filename = path.basename(p).toLowerCase();
      const ext = path.extname(p).toLowerCase();

      if (!options.output?.ignoreAssets) {
        // 规则 A: 排除预设的冲突文件（适用于所有目录）
        // fix: 检查完整相对路径或文件名是否匹配预设排除模式
        const shouldExclude = Array.from(exclusions).some((pattern) => {
          // 如果模式以点结尾（如 'tsconfig.'），检查文件名是否以该模式开头
          if (pattern.endsWith('.')) {
            return filename.startsWith(pattern);
          }

          // 直接检查文件扩展名是否匹配（如直接以 '.ts' 命名的文件，虽然几乎不可能）
          if (pattern.startsWith('.')) {
            return ext === pattern;
          }

          // 否则检查完整相对路径或文件名是否完全匹配
          return relativeToRoot === pattern || filename === pattern;
        });

        // 最终验证文件是否排除拷贝
        if (shouldExclude) return false;
      } else if (exclusions.has(relativeToRoot) || exclusions.has(filename)) {
        // 规则 B: 如果指定了 ignoreAssets 则由用户控制
        return false;
      }

      // 规则 C: Vue 文件全网封杀，绝对不作为 Asset 拷贝
      if (ext === '.vue') return false;

      // 规则 D: 智能区分源码与配置文件
      const isInsideSrc = p.startsWith(inputPath + path.sep);

      // 在 src 里面的 js/less 等 归编译管线处理，这里不拷贝
      if (isInsideSrc && this.pipelineFiles.includes(ext)) {
        return false;
      }

      // 如果是根目录下的 js/less 等 (如 tailwind.config.js)，
      // 会绕过上面的 if，作为 Asset 被安全拷贝
      return true;
    });

    const absFiles = new Set(assetFiles.map((f) => this.fileCompiler.getAbsPath(f)));

    // 先清理不存在的输出与缓存记录（即使 assetFiles 为空也需要执行）
    await this.cleanupManager.cleanupOldOutput(CacheKey.ASSET, (u) => !absFiles.has(u.file));

    if (!assetFiles.length) return 0;

    // fix: 在清理之后重新加载缓存，避免把已删除条目写回去
    const cache = await this.fileCompiler.loadCache(CacheKey.ASSET);

    // 并行拷贝所有资源文件
    const copied = await Promise.all(
      assetFiles.map((file) => {
        return this.processAsset(file, cache);
      }),
    );

    // 资产缓存直接由 AssetManager 维护，这里统一落盘
    await this.fileCompiler.saveCache(cache);

    return copied.filter(Boolean).length;
  }

  /**
   * Process single asset file, compare with cache and decide whether to copy.
   */
  async processAsset(
    filePath: string,
    existingCache?: LoadedCache<FileCacheMeta>,
  ): Promise<FileCacheMeta | undefined> {
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
      this.skippedCount++;
      return;
    }

    // 计算输出路径并执行拷贝
    const outputPath = this.fileCompiler.resolveOutputPath(absPath);

    await fs.promises.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.promises.copyFile(absPath, outputPath);

    // 添加到待更新队列
    this.updateCache(absPath, fileMeta, cache);

    // fix: watch 场景直接调用 processAsset 时，当前文件需要立即落盘缓存
    if (this.fileCompiler.getIsCache() && !existingCache) {
      await this.fileCompiler.saveCache(cache);
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
