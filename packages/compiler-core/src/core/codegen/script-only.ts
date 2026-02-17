import { generate as babelGenerator } from '@babel/generator';
import { ICompilationContext } from '@compiler/context/types';
import { executePlugins } from '@shared/plugin-executor';
import { ReactIRDescriptor } from '@transform/sfc';
import { GeneratorOptions, GeneratorResult } from './component';

export function generateOnlyScript(
  ir: ReactIRDescriptor,
  ctx: ICompilationContext,
  options?: GeneratorOptions,
): GeneratorResult {
  const ast = ir.script.scriptAST!;
  const { code } = babelGenerator(ast, options);

  const result: GeneratorResult = {
    ast,
    code,
    source: ctx.source,
  };

  executePlugins(options?.plugins, result, ctx);

  return result;
}
