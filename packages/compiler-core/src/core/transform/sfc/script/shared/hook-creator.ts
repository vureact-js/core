import * as t from '@babel/types';
import { REACT_API_MAP } from '@consts/react-api-map';

export function createUseCallback(body: t.Expression, deps?: t.ArrayExpression): t.CallExpression {
  return t.callExpression(t.identifier(REACT_API_MAP.useCallback), [
    body,
    deps ?? t.arrayExpression([]),
  ]);
}

export function createUseMemo(body: t.Expression, deps?: t.ArrayExpression): t.CallExpression {
  return t.callExpression(t.identifier(REACT_API_MAP.useMemo), [
    t.arrowFunctionExpression([], body),
    deps ?? t.arrayExpression([]),
  ]);
}

export function createUseImperativeHandle(
  refId: t.Identifier,
  init: t.FunctionExpression | t.ArrowFunctionExpression,
): t.CallExpression {
  return t.callExpression(t.identifier(REACT_API_MAP.useImperativeHandle), [refId, init]);
}
