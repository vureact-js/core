import { CompilerOptions } from '@src/compiler';

export interface CliOptions extends Omit<
  CompilerOptions,
  'output' | 'format' | 'generate' | 'logging' | 'onSuccess'
> {
  /**
   * @default '.vureact'
   */
  workspace?: string;

  /**
   * @default 'dist'
   */
  outDir?: string;

  /**
   * @default false
   */
  format?: boolean;

  /**
   * @default 'prettier'
   */
  formatter?: 'prettier' | 'builtin';
}
