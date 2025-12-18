import * as t from '@babel/types';
import { RV3_HOOKS } from '@consts/runtimeModules';
import { CallExpArgs } from '../types';

export function buildUseState$(_arguments: CallExpArgs, shallow = false): t.CallExpression {
  const api = !shallow ? RV3_HOOKS.useState$ : RV3_HOOKS.useShallowState;
  return t.callExpression(t.identifier(api), _arguments);
}

export function buildUseReadonly(_arguments: CallExpArgs, shallow = false): t.CallExpression {
  const api = !shallow ? RV3_HOOKS.useReadonly : RV3_HOOKS.useShallowReadonly;
  return t.callExpression(t.identifier(api), _arguments);
}

export function buildUseMemo(_arguments: CallExpArgs, deps?: t.ArrayExpression): t.CallExpression {
  _arguments.push(deps || t.arrayExpression());
  return t.callExpression(t.identifier('useMemo'), _arguments);
}
