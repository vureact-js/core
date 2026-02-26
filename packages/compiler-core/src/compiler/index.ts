import { FileCompiler } from './shared/file-compiler';

/**
 * Next Vue to React compiler, compiles Vue 3 syntax into runnable React 18+ code.
 * @see https://vureact.vercel.app
 */
export class VuReact extends FileCompiler {}

export * from './shared/base-compiler';
export * from './shared/define-config';
export * from './shared/file-compiler';
export * from './shared/helper';
export * from './shared/types';
