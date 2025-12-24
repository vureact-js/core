import { NodePath } from '@babel/core';
import * as t from '@babel/types';
import { RuntimeModules } from '@consts/runtimeModules';
import { recordImport } from '@shared/runtime-utils';
import { varDeclCallExp, VarDeclCallExpDestructureResult } from './destructure-var-decl-call-exp';
import { CallExpArgs } from './types';
import { warnVueHookArguments, warnVueHookInBlock } from './unsupported-warn';

export function requiredVarDeclHandling(
  path: NodePath<t.VariableDeclarator>,
  adaptApis: object,
): VarDeclCallExpDestructureResult | null {
  const result = varDeclCallExp.destructure(path);
  const adaptApi = adaptApis[result.callExpName as keyof typeof adaptApis];

  if (!adaptApi || !result.name) return null;

  warnVueHookInBlock(path);
  recordImport(RuntimeModules.RV3_HOOKS, adaptApi, true);

  return result;
}

export function requiredCallExpHandling(
  path: NodePath<t.CallExpression>,
  adaptApis: object,
): { args: CallExpArgs; adaptApi: string } | null {
  const { callee, arguments: args } = path.node;

  if (!t.isIdentifier(callee)) return null;

  const { name: fnName } = callee;
  const adaptApi = adaptApis[fnName as keyof typeof adaptApis];

  if (!adaptApi) return null;

  warnVueHookInBlock(path);
  warnVueHookArguments(args);
  recordImport(RuntimeModules.RV3_HOOKS, adaptApi, true);

  return { args, adaptApi };
}
