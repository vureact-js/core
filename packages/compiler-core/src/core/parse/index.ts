import { ICompilationContext } from '@compiler/context/types';
import { parseOnlyScript } from './script-only';
import { ParseResult, ParserOptions, parseSFC } from './sfc';

export * from './script-only';
export * from './sfc';

export function parse(
  source: string,
  ctx: ICompilationContext,
  options?: ParserOptions,
): ParseResult {
  const parser = ctx.inputType === 'sfc' ? parseSFC : parseOnlyScript;
  return parser(source, ctx, options);
}
