import { ICompilationContext } from '@compiler/context/types';
import { ReactIRDescriptor } from '../transform';
import { generateComponent, GeneratorOptions, GeneratorResult } from './component';
import { generateOnlyScript } from './script-only';

export * from './component';
export * from './script-only';

export function generate(
  ir: ReactIRDescriptor,
  ctx: ICompilationContext,
  options?: GeneratorOptions,
): GeneratorResult {
  const generator = ctx.inputType === 'sfc' ? generateComponent : generateOnlyScript;
  return generator(ir, ctx, options);
}
