import * as t from '@babel/types';
import { REACT_API_MAP } from '@consts/react-api-map';

export function createUseCallback(body: t.Expression, deps: t.ArrayExpression): t.CallExpression {
  return t.callExpression(t.identifier(REACT_API_MAP.useCallback), [body, deps]);
}
