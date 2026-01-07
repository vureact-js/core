import * as t from '@babel/types';
import { ReactApis } from '@src/consts/runtimeModules';

export function createUseCallback(
  body: t.Expression,
  deps: t.ArrayExpression | t.Identifier[],
): t.CallExpression {
  return t.callExpression(t.identifier(ReactApis.useCallback), [
    body,
    Array.isArray(deps) ? t.arrayExpression(deps) : deps,
  ]);
}
