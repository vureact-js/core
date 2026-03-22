import { GeneratorOptions } from '@babel/generator';
import { Options as PrettierOptions } from 'prettier';
import { CompilationUnit } from './compilation-unit';
import { CompilerPlugins } from './plugin-types';

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

  /**
   * Whether to enable build cache and reuse the previous cache results
   * @default true
   */
  cache?: boolean;

  /**
   * @see {@link OutputConfig}
   */
  output?: OutputConfig;

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
   * @see {@link GeneratorOptions}
   */
  generate?: GeneratorOptions;

  /**
   * Watch files in real time and auto-recompile on changes.
   * @default false
   */
  watch?: boolean;

  /**
   * Whether to process Less/Sass style languages into CSS
   * @default true
   */
  preprocessStyles?: boolean;

  /**
   * Specify the path to the Vue Router config file
   * The file must default export createRouter
   * Used to inject Router Provider in React's main.tsx or main.jsx
   *
   *
   *
   * @see {@link RouterConfig}
   *
   * @example
   * ```js
   * router: {
   *   configFile: 'src/router/index.ts'
   * }
   * ```
   *
   * Assumes the config file default exports createRouter:
   *
   * ```js
   * // src/router/index.ts
   * export default createRouter({ ... })
   * ```
   */
  router?: RouterConfig;

  /**
   * Can be used to add plugins and customize the output results of
   * the parse/transform/codegen/compiled stages respectively.
   *
   * @see {@link CompilerPlugins}
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
  plugins?: CompilerPlugins;

  /**
   * @see {@link FormatConfig}
   */
  format?: FormatConfig;

  /**
   * Log Control Options
   * @see {@link LoggingConfig}
   */
  logging?: LoggingConfig;

  /**
   * Execute only after the first successful full compilation.
   */
  onSuccess?: () => Promise<void | undefined>;

  /**
   * Execute after file are added or recompiled in `watch` mode.
   *
   * @param event Add or modify file
   * @param unit Current sfc or script file compilation unit
   */
  onChange?: (event: 'add' | 'change', unit: CompilationUnit) => Promise<void | undefined>;
}

export interface OutputConfig {
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

  /**
   * Whether to automatically call Vite to initialize a standard
   * React project environment before compilation.
   * @default true
   */
  bootstrapVite?:
    | boolean
    | {
        /**
         * Specify the React template type.
         * @default 'react-ts'
         */
        template?: 'react-ts' | 'react';

        /**
         * Specify the Vite version for initial installation, which must start with '@'.
         * @default '@latest'
         *
         * @example
         *
         * ```js
         * { vite: '@7' }
         * ```
         */
        vite?: string;

        /**
         * Specify the React version for initial installation.
         * @default 'latest'
         *
         * @example
         *
         * ```js
         * { react: '^19.2.0' }
         * ```
         */
        react?: string;
      };

  /**
   * Specify asset files that do not need to be copied.
   * They can be filenames or paths, using fuzzy matching.
   * @default
   * [
   *  'package.json',
   *  'package-lock.json',
   *  'pnpm-lock.yaml',
   *  'index.html',
   *  'tsconfig.',
   *  'vite.config.',
   *  'eslint.config.',
   *  'readme.',
   *  'vue.',
   *  '.vue',
   *  'vureact.config.js',
   *  'vureact.config.ts',
   * ]
   */
  ignoreAssets?: string[];
}

export interface RouterConfig {
  /**
   * Path to the Vue Router config file.
   * Must be the location where `createRouter` is **exported as default**.
   */
  configFile: string;

  /**
   * Automatically update the react app entry file to use the VuReact Router Provider.
   *
   * Note: Injection only occurs when `output.bootstrapVite` is enabled.
   *
   * @default true
   */
  autoUpdateEntry?: boolean;
}

export interface FormatConfig {
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
}

export interface LoggingConfig {
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
}
