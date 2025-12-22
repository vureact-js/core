import { NodePath, types as t } from '@babel/core';
import { React_Hooks, RuntimeModules } from '@consts/runtimeModules';
import { compileContext } from '@shared/compile-context';
import { logger } from '@shared/logger';
import { recordImport } from '@shared/runtime-utils';
import { reactHookBuilder } from './builders/react-hook-builder';
import { reactHookVarDecl } from './builders/react-hook-variable-declaration';
import { analyzeFuncBodyDeps } from './shared/analyze-dependency';
import { checkNodeIsInBlock } from './shared/babel-utils';
import { varDeclCallExp } from './shared/destructure-var-decl-call-exp';
import { ReactiveTypes } from './shared/types';

const adaptApis = {
  computed: React_Hooks.useMemo,
} as const;

export function transformComputed(path: NodePath<t.VariableDeclarator>) {
  const result = varDeclCallExp.destructure(path);
  const useMemoApi = adaptApis[result.callExpName as keyof typeof adaptApis];

  if (!useMemoApi || !result.name) return;

  const [initValue] = result.callExpArgs;

  if (!initValue || !t.isFunction(initValue)) {
    const { source, filename } = compileContext.context;
    logger.error('computed must receive a getter function.', {
      source,
      loc: initValue!.loc!,
      file: filename,
    });
    return;
  }

  const deps = analyzeFuncBodyDeps(initValue.body, path);

  checkNodeIsInBlock(path);
  recordImport(RuntimeModules.REACT, useMemoApi, true);

  const newNode = reactHookVarDecl.useMemo({
    ...result,
    deps,
    reactiveType: result.callExpName as ReactiveTypes,
  });

  path.replaceWith(newNode);
}

export function transformUndeclaredComputedCall(path: NodePath<t.CallExpression>) {
  const { callee, arguments: args } = path.node;

  if (t.isIdentifier(callee) && callee.name in adaptApis) {
    checkNodeIsInBlock(path);
    recordImport(RuntimeModules.REACT, React_Hooks.useMemo, true);
    path.replaceWith(reactHookBuilder.useMemo(args));
  }
}
