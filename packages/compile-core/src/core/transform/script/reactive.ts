import { NodePath, types as t, traverse } from '@babel/core';
import { RuntimeModules, RV3_HOOKS } from '@consts/runtimeModules';
import { recordImport } from '@shared/runtime-utils';
import { compileContext } from '@src/shared/compile-context';
import { ScriptBlockIR } from '.';
import { build$useState } from './builders/react-hook-builder';
import { reactHookVarDecl } from './builders/react-hook-declarator';
import { checkNodeIsInBlock, getVarKind } from './shared/babel-utils';
import { reactiveVarDecl } from './shared/reactive-variable-declarator';

const ADAPT_APIS = {
  ref: RV3_HOOKS.$useState,
  reactive: RV3_HOOKS.$useState,
  shallowRef: RV3_HOOKS.useShallowState,
  shallowReactive: RV3_HOOKS.useShallowState,
} as const;

export const isReactiveApi = (name: string): boolean => name in ADAPT_APIS;

const getAdaptApi = (name?: string) => {
  return ADAPT_APIS[name as keyof typeof ADAPT_APIS];
};

export function transformReactive(ast: ScriptBlockIR) {
  traverse(ast, {
    // 处理响应式 api 变量声明
    VariableDeclarator: handleVariableDeclarator,
  });
}

function handleVariableDeclarator(path: NodePath<t.VariableDeclarator>) {
  const { node } = path;
  const { dependencies } = compileContext.context;

  reactiveVarDecl.init(node);

  const kind = getVarKind(path);
  const varName = reactiveVarDecl.varName();
  const apiName = reactiveVarDecl.apiName();
  const apiArgs = reactiveVarDecl.apiArgs();
  const adaptApi = getAdaptApi(apiName);

  if (!adaptApi) return;

  checkNodeIsInBlock(path);
  recordImport(RuntimeModules.RV3_HOOKS, adaptApi, true);

  if (!varName) {
    path.replaceWith(build$useState(apiArgs));
    return;
  }

  const { parameters, annotation } = reactiveVarDecl.apiTSTypes();
  const newNode = reactHookVarDecl.$useState(kind, varName, apiArgs, {
    varType: reactiveVarDecl.varType(),
    callTypeParameters: parameters,
    callTypeAnnotation: annotation,
  });

  path.replaceWith(newNode);
  dependencies.add(varName);
}
