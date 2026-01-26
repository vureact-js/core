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

  /**
   * Cache the compilation results to skip some files that do not require updates.
   * @default true
   */
  cacheDirectory?: boolean;

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
  fileInfo: {
    jsx: {
      path: string;
      lang: string;
    };
    css: {
      path?: string;
      code?: string;
    };
  };
}

export type CachedResult = { data: Omit<CompilationUnit, 'source'>[] };

export interface CompilationUnit extends FileMeta {
  file: string; // 原始Vue文件路径
  source: string; // Vue源代码
  output: {
    file: string; // 输出路径
    code: string; // React组件代码
    map?: any; // Source map
  } | null;
}

export interface FileMeta {
  fileSize: number; // 文件大小
  mtime: number; // 修改时间
  hash?: string; // 内容哈希
}
