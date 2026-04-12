import * as t from '@babel/types';
import { ICompilationContext } from '@compiler/context/types';
import { stringToExpr } from '@shared/babel-utils';
import { resolveSpecialExpression } from './resolve-special-expression';

export * from './resolve-special-expression';

/**
 * 模板中的所有字符串表达式都会经过此函数
 */
export function resolveStringExpr(
  input: string,
  ctx: ICompilationContext,
  toStrLiteral = false,
): t.Expression {
  if (toStrLiteral) {
    return t.stringLiteral(input);
  }

  const { filename, scriptData } = ctx;
  const newContent = resolveSpecialExpression(input, ctx);

  try {
    return stringToExpr(newContent, scriptData.lang, filename);
  } catch {
    return t.identifier(newContent);
  }
}
