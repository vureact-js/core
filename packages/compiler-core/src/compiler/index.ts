import { FileCompiler } from './shared/file-compiler';

/**
 * VuReact compiler for batch compiling Vue files.
 *
 * This class extends FileCompiler and serves as the main entry point for the VuReact compilation system.
 * It handles the compilation of Vue files into optimized JSX/TSX code.
 *
 * ### Features
 *
 * - **Flexible input handling**: Accepts either a single file or a directory as input
 *
 * - **Automatic Vue file discovery**: When a folder is provided as input, the compiler automatically
 *   discovers and processes all `.vue` files within it recursively
 *
 * - **Directory structure preservation**: The output directory maintains the same folder hierarchy
 *   as the source, with `.vue` files compiled to corresponding `.jsx` or `.tsx` files
 *
 * - **Focus on SFC & script setup**: Provide user-friendly support for high-fidelity translation to corresponding React code, along with a core runtime adaptation package.
 *
 * - **Default output location**: Compilation results are saved to `.vureact/dist` in the project
 *   root directory by default
 *
 * @example
 * ```typescript
 * // Compile a single file (default output: .vureact/dist)
 * const compiler = new VuReact({
 *   input: './src/component.vue',
 * });
 *
 * // Or compile a folder recursively
 * const compiler = new VuReact({
 *   input: './src'
 * });
 *
 * await compiler.run();
 * ```
 *
 * @extends FileCompiler
 *
 * @see https://vureact.vercel.app/en
 */
export class VuReact extends FileCompiler {}

export * from './shared/base-compiler';
export * from './shared/file-compiler';
export * from './shared/types';
