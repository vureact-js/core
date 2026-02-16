import { FileCompiler } from './shared/file-compiler';

/**
 * 继承自 FileCompiler，作为别名使用
 * @see {@link FileCompiler}
 */
export class VuReact extends FileCompiler {}

export * from './shared/base-compiler';
export * from './shared/file-compiler';
export * from './shared/types';
