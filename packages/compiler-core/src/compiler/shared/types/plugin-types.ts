import { ICompilationContext } from '@compiler/context/types';
import { GeneratorResult, ParseResult, ReactIRDescriptor } from '@src/index';
import { CompilationResult } from './compilation-result';

export type CompilerPlugins = PluginRegister<CompilationResult> & {
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

export interface PluginRegister<T> {
  [name: string]: (result: T, ctx: ICompilationContext) => void;
}
