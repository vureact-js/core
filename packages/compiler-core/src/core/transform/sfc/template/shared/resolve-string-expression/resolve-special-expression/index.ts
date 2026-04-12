import { ICompilationContext } from '@compiler/context/types';
import { resolveEmitsCalls } from './resolve-emit-call';
import { resolveRefAccess } from './resolve-ref-access';

/**
 * 解决各种需要特殊处理的模板字符串表达式
 */
export function resolveSpecialExpression(input: string, ctx: ICompilationContext): string {
  const resolver = [resolveEmitsCalls, resolveRefAccess];
  input = resolver.reduce((result, fn) => fn(result, ctx), input);
  return input;
}
