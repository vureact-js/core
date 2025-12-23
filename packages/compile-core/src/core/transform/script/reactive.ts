import { NodePath, types as t } from '@babel/core';
import { RuntimeModules, RV3_HOOKS } from '@consts/runtimeModules';
import { recordImport } from '@shared/runtime-utils';
import { reactHookBuilder } from './builders/react-hook-builder';
import { reactHookVarDecl } from './builders/react-hook-variable-declaration';
import { varDeclCallExp } from './shared/destructure-var-decl-call-exp';
import { ReactiveTypes } from './shared/types';
import { warnVueHookInBlock } from './shared/unsupported-warn';

const adaptApis = {
  ref: RV3_HOOKS.useState$,
  toRefs: RV3_HOOKS.useState$,
  reactive: RV3_HOOKS.useState$,
  shallowRef: RV3_HOOKS.useShallowState,
  shallowReactive: RV3_HOOKS.useShallowState,
} as const;

export function transformReactive(path: NodePath<t.VariableDeclarator>) {
  const result = varDeclCallExp.destructure(path);
  const useState$Api = adaptApis[result.callExpName as keyof typeof adaptApis];

  if (!useState$Api || !result.name) return;

  warnVueHookInBlock(path);
  recordImport(RuntimeModules.RV3_HOOKS, useState$Api, true);

  const newNode = reactHookVarDecl.useState$({
    ...result,
    reactiveType: result.callExpName as ReactiveTypes,
    shallow: result.name.startsWith('shallow'),
  });

  path.replaceWith(newNode);
}

export function transformUndeclaredReactiveCall(path: NodePath<t.CallExpression>) {
  const { callee, arguments: args } = path.node;

  if (t.isIdentifier(callee) && callee.name in adaptApis) {
    warnVueHookInBlock(path);
    recordImport(RuntimeModules.RV3_HOOKS, RV3_HOOKS.useState$, true);
    path.replaceWith(reactHookBuilder.useState$(args));
  }
}
