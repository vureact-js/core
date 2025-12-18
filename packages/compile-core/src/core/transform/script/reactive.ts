import { NodePath, types as t, traverse } from '@babel/core';
import { RuntimeModules, RV3_HOOKS } from '@consts/runtimeModules';
import { recordImport } from '@shared/runtime-utils';
import { ScriptBlockIR } from '.';
import { buildUseState$ } from './builders/react-hook-builder';
import { reactHookVarDecl } from './builders/react-hook-variable-declaration';
import { checkNodeIsInBlock } from './shared/babel-utils';
import { varDeclCallExp } from './shared/destructure-var-decl-call-exp';
import { ReactiveTypes } from './types';

const adaptApis = {
  ref: RV3_HOOKS.useState$,
  reactive: RV3_HOOKS.useState$,
  shallowRef: RV3_HOOKS.useShallowState,
  shallowReactive: RV3_HOOKS.useShallowState,
} as const;

export function transformReactive(ast: ScriptBlockIR) {
  traverse(ast, {
    // 处理响应式 api 变量声明
    VariableDeclarator: handleVariableDeclarator,
  });
}

function handleVariableDeclarator(path: NodePath<t.VariableDeclarator>) {
  const result = varDeclCallExp.destructure(path);
  const useState$Api = adaptApis[result.callExpName as keyof typeof adaptApis];

  if (!useState$Api) return;

  checkNodeIsInBlock(path);
  recordImport(RuntimeModules.RV3_HOOKS, useState$Api, true);

  if (!result.name) {
    path.replaceWith(buildUseState$(result.callExpArgs));
    return;
  }

  const newNode = reactHookVarDecl.useState$({
    ...result,
    reactiveType: result.callExpName as ReactiveTypes,
    shallow: result.name.startsWith('shallow'),
  });

  path.replaceWith(newNode);
}
