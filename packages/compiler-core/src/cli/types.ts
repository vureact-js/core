import { CompilerOptions } from '@src/compiler';

export interface CliOptions extends Omit<
  CompilerOptions,
  'output' | 'format' | 'generate' | 'logging' | 'onSuccess' | 'onChange'
> {
  /**
   * @default false
   */
  bootstrapVite?: boolean;
  /**
   * @default '.vureact'
   */
  workspace?: string;

  /**
   * @default 'react-app'
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
