import { NodePath, types as t } from '@babel/core';
import { compileContext } from '@shared/compile-context';
import { RuntimeModules } from '@src/consts/runtimeModules';
import { logger } from '@src/shared/logger';
import { recordImport } from '@src/shared/runtime-utils';
import { reactHookBuilder } from './builders/react-hook-builder';
import { reactHookVarDecl } from './builders/react-hook-variable-declaration';
import { analyzeFunctionDependencies } from './shared/analyze-dependency';
import { checkNodeIsInBlock } from './shared/babel-utils';
import { varDeclCallExp } from './shared/destructure-var-decl-call-exp';
import { ReactiveTypes } from './shared/types';

const adaptApis = {
  computed: 'useMemo',
} as const;

export function transformComputed(path: NodePath<t.VariableDeclarator>) {
  const result = varDeclCallExp.destructure(path);
  const useMemoApi = adaptApis[result.callExpName as keyof typeof adaptApis];

  if (!useMemoApi) return;

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

  const deps = analyzeFunctionDependencies(initValue.body, path);

  checkNodeIsInBlock(path);
  recordImport(RuntimeModules.REACT, useMemoApi, true);

  if (!result.name) {
    path.replaceWith(reactHookBuilder.useMemo(result.callExpArgs, deps));
    return;
  }

  const newNode = reactHookVarDecl.useMemo({
    ...result,
    deps,
    reactiveType: result.callExpName as ReactiveTypes,
  });

  path.replaceWith(newNode);
}
