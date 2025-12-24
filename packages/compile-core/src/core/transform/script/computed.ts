import { NodePath, types as t } from '@babel/core';
import { React_Hooks, RuntimeModules } from '@consts/runtimeModules';
import { compileContext } from '@shared/compile-context';
import { logger } from '@shared/logger';
import { recordImport } from '@shared/runtime-utils';
import { reactHookBuilder } from './builders/react-hook-builder';
import { reactHookVarDecl } from './builders/react-hook-variable-declaration';
import { analyzeFuncBodyDeps } from './shared/analyze-dependency';
import { requiredVarDeclHandling } from './shared/required-before-transform';
import { ReactiveTypes } from './shared/types';
import { warnVueHookInBlock } from './shared/unsupported-warn';

const adaptApis = {
  computed: React_Hooks.useMemo,
} as const;

export function transformComputed(path: NodePath<t.VariableDeclarator>) {
  const result = requiredVarDeclHandling(path, adaptApis);

  if (!result) return;

  const [fnBody] = result.callExpArgs;

  if (!fnBody || !t.isFunction(fnBody)) {
    const { source, filename } = compileContext.context;
    logger.error('computed must receive a getter function.', {
      source,
      loc: fnBody!.loc!,
      file: filename,
    });
    return;
  }

  const deps = analyzeFuncBodyDeps(fnBody.body, path);
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
    warnVueHookInBlock(path);
    recordImport(RuntimeModules.REACT, React_Hooks.useMemo, true);
    path.replaceWith(reactHookBuilder.useMemo(args));
  }
}
