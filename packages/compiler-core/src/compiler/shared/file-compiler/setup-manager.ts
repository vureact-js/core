import { FileCompiler } from '.';
import { AssetManager } from './asset-manager';
import { CacheManager } from './cache-manager';
import { CleanupManager } from './cleanup-manager';
import { CompilationUnitProcessor } from './compilation-unit';
import { FileProcessor } from './file-processor';
import { PipelineManager } from './pipeline-manager';
import { ViteBootstrapper } from './vite-bootstrapper';

export interface CompilerManager {
  viteBootstrapper: ViteBootstrapper;
  fileProcessor: FileProcessor;
  pipelineManager: PipelineManager;
  assetManager: AssetManager;
  cacheManager: CacheManager;
  cleanupManager: CleanupManager;
}

/**
 * 用于向 {@link FileCompiler} 注入依赖管理器
 */
export class SetupManager {
  constructor(private getCompiler: () => FileCompiler) {
    this.setup();
  }

  /**
   * 初始化所有管理器实例
   *
   * !必须按照依赖关系顺序创建各个管理器：
   * 1. 基础管理器（无依赖）
   * 2. 依赖基础管理器的管理器
   * 3. 依赖其他管理器的管理器
   */
  private setup() {
    const fileCompiler = this.getCompiler();

    this.setupBaseManager(fileCompiler);
    this.setupManagedByBase(fileCompiler);
    this.setupCompositeManager(fileCompiler);
  }

  /**
   * 创建基础的管理器（无外部依赖）
   */
  private setupBaseManager(fileCompiler: FileCompiler) {
    // 初始化管理器为空对象
    fileCompiler.manager = {} as CompilerManager;

    const manager = fileCompiler.manager;

    manager.cacheManager = new CacheManager(fileCompiler);
    manager.cleanupManager = new CleanupManager(fileCompiler);
  }

  /**
   * 创建依赖基础管理器的管理器
   */
  private setupManagedByBase(fileCompiler: FileCompiler) {
    const manager = fileCompiler.manager;

    manager.fileProcessor = new FileProcessor(
      fileCompiler,
      new CompilationUnitProcessor(fileCompiler),
      manager.cacheManager,
    );
  }

  /**
   * 创建依赖其他管理器的管理器
   */
  private setupCompositeManager(fileCompiler: FileCompiler) {
    const manager = fileCompiler.manager;

    manager.viteBootstrapper = new ViteBootstrapper(fileCompiler, fileCompiler.options);
    manager.pipelineManager = new PipelineManager(fileCompiler, manager.fileProcessor);
    manager.assetManager = new AssetManager(fileCompiler, manager.cleanupManager);
  }
}
