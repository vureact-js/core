import { NodePath, types as t } from '@babel/core';
import { RuntimeModules, RV3_HOOKS } from '@consts/runtimeModules';
import { recordImport } from '@shared/runtime-utils';
import { reactHookBuilder } from './builders/react-hook-builder';
import { reactHookVarDecl } from './builders/react-hook-variable-declaration';
import { checkNodeIsInBlock } from './shared/babel-utils';
import { varDeclCallExp } from './shared/destructure-var-decl-call-exp';
import { ReactiveTypes } from './types';

const adaptApis = {
  readonly: RV3_HOOKS.useReadonly,
  shallowReadonly: RV3_HOOKS.useShallowReadonly,
} as const;

export function transformReadonly(path: NodePath<t.VariableDeclarator>) {
  const result = varDeclCallExp.destructure(path);
  const useReadonlyApi = adaptApis[result.callExpName as keyof typeof adaptApis];

  if (!useReadonlyApi) return;

  checkNodeIsInBlock(path);
  recordImport(RuntimeModules.RV3_HOOKS, useReadonlyApi, true);

  if (!result.name) {
    path.replaceWith(reactHookBuilder.useReadonly(result.callExpArgs));
    return;
  }

  const newNode = reactHookVarDecl.useReadonly({
    ...result,
    reactiveType: result.callExpName as ReactiveTypes,
    shallow: result.name.startsWith('shallow'),
  });

  path.replaceWith(newNode);
}
