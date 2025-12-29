import * as t from '@babel/types';

export function buildUseMemo(body: t.Expression, deps: t.ArrayExpression) {
  return t.callExpression(t.identifier('useMemo'), [t.arrowFunctionExpression([], body), deps]);
}
