import { GeneratorOptions } from '@babel/generator';
import { GeneratorResult } from '@src/core/codegen';
import { Options as PrettierOptions } from 'prettier';

export interface CompilerOptions {
  /**
   * Manually specify the root directory.
   * @default process.cwd()
   */
  root?: string;

  /**
   * Path to the source file or directory.
   * - If it is a file, compile the single file.
   * - If it is a directory, recursively compile all .vue files under the directory.
   *
   * @default
   * 'src/' // The src directory under the root directory
   */
  input?: string;

  output?: {
    /**
     * Output the name of the root directory corresponding to the file's location.
     * @default '.vureact'
     */
    workspace?: string;

    /**
     * Output directory name, relative to `output.workspace`
     * @default 'dist'
     */
    outDir?: string;
  };

  /**
   * Excluded file/directory matching patterns (glob syntax supported).
   * @default
   * [
   *  'node_modules/**',
   *  'dist/**',
   *  'build/**',
   *  '.git/**',
   *  '.vureact/**'
   * ]
   */
  exclude?: string[];

  /**
   * Whether to recursively search subdirectories.
   * @default true
   */
  recursive?: boolean;

  /**
   * Options passed through to babel-generator.
   */
  generate?: GeneratorOptions;

  format?: {
    /**
     * @default true
     */
    enabled?: boolean;

    /**
     * @default 'prettier'
     */
    formatter?: 'prettier' | 'builtin';

    /**
     * Configure the formatting options for Prettier,
     * which takes effect only when the formatter is set to 'prettier'.
     */
    prettierOptions?: PrettierOptions;
  };

  /**
   * Log Control Options
   */
  logging?: {
    /**
     * @default true
     */
    enabled?: boolean;

    /** Whether to output warning messages. */
    warnings?: boolean;

    /** Whether to output info messages. */
    info?: boolean;

    /** Whether to output error messages. */
    errors?: boolean;
  };
}

export interface CompileFileResult {
  /** React file path. */
  filePath: string;

  /** The result of compiling Vue code into React code. */
  result: CompileResult;
}

export interface CompileResult extends GeneratorResult {
  fileId: string;
  fileInfo: {
    jsx: {
      file: string;
      lang: string;
    };
    css: {
      file?: string;
      hash?: string;
      code?: string;
    };
  };
}

export type CompileCache = CacheData<CompileCacheNode[]>;

export type AssetCache = CacheData<AssetCacheNode[]>;

interface CacheData<T> {
  cached: T;
}

export type CacheNode = CompileCacheNode | AssetCacheNode;

export type CompileCacheNode = Omit<CompilationUnit, 'source'>;

export type AssetCacheNode = FileMeta & { file: string };

export interface CompilationUnit extends FileMeta {
  file: string; // 原始Vue文件路径
  fileId: string; // 文件id
  source: string; // Vue源代码
  output: {
    jsx: {
      file: string;
      code: string; // React组件代码
    };
    css: {
      file?: string;
      code?: string;
    };
  } | null;
}

export interface FileMeta {
  fileSize: number; // 文件大小
  mtime: number; // 修改时间
  hash?: string; // 内容哈希
}

export interface CacheCheckResult {
  shouldCompile: boolean;
  hash?: string; // 如果计算了新哈希，返回给调用者以便更新缓存
}

export enum CacheFilename {
  /** 编译缓存 */
  COMPILE = 'compile-cache',
  /** 附属资源文件缓存 */
  ASSET = 'asset-cache',
}
