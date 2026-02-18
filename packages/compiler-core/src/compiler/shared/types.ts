import { GeneratorOptions } from '@babel/generator';
import { GeneratorResult, ParseResult, ReactIRDescriptor } from '@src/core';
import { Options as PrettierOptions } from 'prettier';
import { ICompilationContext } from '../context/types';

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

  /**
   * Watch files in real time and auto-recompile on changes.
   * @default false
   */
  watch?: boolean;

  /**
   * Can be used to add plugins and customize the output results of
   * the parse/transform/codegen/compiled stages respectively.
   *
   * @example
   * ```ts
   * plugins: {
   *  // For example, add custom data to the parsing results.
   *  parser: {
   *   myPlugin: (result, ctx) => {
   *     result.metadata = {
   *       timestamp: Date.now()
   *     }
   *   },
   *  },
   *
   *  // If the key names parse/transform/codegen are not specified,
   *  // the plugin will execute upon completion of compilation.
   *  yourPlguin: (result) => {
   *    console.log(result)
   *  }
   * }
   * ```
   */
  plugins?: PluginRegister<CompilationResult> & {
    /**
     * Register parser plugins
     */
    parser?: PluginRegister<ParseResult>;

    /**
     * Register transformer plugins
     */
    transformer?: PluginRegister<ReactIRDescriptor>;

    /**
     * Register codegen plugins
     */
    codegen?: PluginRegister<GeneratorResult>;
  };

  format?: {
    /**
     * @default false
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

  /**
   * Execute only after the first successful full compilation.
   */
  onSuccess?: () => Promise<void | undefined>;

  /**
   * Execute after file are added or recompiled in `watch` mode.
   *
   * @param type Add or modify file
   * @param result Options
   */
  onChange?: (
    type: 'add' | 'change',
    result: {
      /**
       * The compilation result of the current file.
       *
       * Note that the contents of the `source` and `code` fields have been cleared.
       */
      compilationUnit?: CompilationUnit;
      /**
       * The path of the asset file.
       */
      assetFile?: string;
    },
  ) => Promise<void | undefined>;
}

export interface PluginRegister<T> {
  [name: string]: (result: T, ctx: ICompilationContext) => void;
}

export type CompilationResult = SFCCompilationResult | ScriptCompilationResult;

export interface SFCCompilationResult extends GeneratorResult {
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

export interface ScriptCompilationResult extends GeneratorResult {
  fileId: string;
  fileInfo: {
    script: {
      file: string;
      lang: string;
    };
  };
}

export interface ScriptUnit extends CompilationUnit {
  output: {
    script: OutputItem;
  } | null;
}

export interface SFCUnit extends CompilationUnit {
  output: {
    jsx: OutputItem;
    css: Partial<OutputItem>;
  } | null;
}

interface OutputItem {
  file: string;
  code: string;
}

export interface AssetUnit extends Omit<CompilationUnit, 'fileId' | 'source'> {}

export interface CompilationUnit extends FileMeta {
  file: string; // 原始文件路径
  fileId: string; // 文件id
  source: string; // 源代码
}

export type LoadedCache<T = CacheMeta> = {
  key: CacheKey;
  target: T[];
  source: CacheList;
};

export type CacheMeta = Vue2ReactCacheMeta | FileCacheMeta;

export enum CacheKey {
  SFC = 'sfc',
  SCRIPT = 'script',
  ASSET = 'copied',
}

export interface CacheList {
  [CacheKey.SFC]: Vue2ReactCacheMeta[];
  [CacheKey.SCRIPT]: FileCacheMeta[];
  [CacheKey.ASSET]: FileCacheMeta[];
}

export type Vue2ReactCacheMeta = Omit<SFCUnit, 'source'>;

export interface FileCacheMeta extends FileMeta {
  file: string;
}

export interface FileMeta {
  fileSize: number; // 文件大小
  mtime: number; // 修改时间
  hash?: string; // 内容哈希
}

export interface CacheCheckResult {
  shouldCompile: boolean;
  hash?: string;
}
