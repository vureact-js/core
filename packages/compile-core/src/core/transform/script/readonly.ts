import { NodePath, types as t } from '@babel/core';
import { RuntimeModules, RV3_HOOKS } from '@consts/runtimeModules';
import { recordImport } from '@shared/runtime-utils';
import { reactHookBuilder } from './builders/react-hook-builder';
import { reactHookVarDecl } from './builders/react-hook-variable-declaration';
import { requiredVarDeclHandling } from './shared/required-before-transform';
import { ReactiveTypes } from './shared/types';
import { warnVueHookInBlock } from './shared/unsupported-warn';

const adaptApis = {
  readonly: RV3_HOOKS.useReadonly,
  shallowReadonly: RV3_HOOKS.useShallowReadonly,
} as const;

export function transformReadonly(path: NodePath<t.VariableDeclarator>) {
  const result = requiredVarDeclHandling(path, adaptApis);

  if (!result) return;

  const newNode = reactHookVarDecl.useReadonly({
    ...result,
    reactiveType: result.callExpName as ReactiveTypes,
    shallow: result.name?.startsWith('shallow'),
  });

  path.replaceWith(newNode);
}

export function transformUndeclaredReadonlyCall(path: NodePath<t.CallExpression>) {
  const { callee, arguments: args } = path.node;

  if (t.isIdentifier(callee) && callee.name in adaptApis) {
    warnVueHookInBlock(path);
    recordImport(RuntimeModules.RV3_HOOKS, RV3_HOOKS.useReadonly, true);
    path.replaceWith(reactHookBuilder.useReadonly(args));
  }
}
