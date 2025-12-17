import { NodePath, types as t, traverse } from '@babel/core';
import { RuntimeModules, RV3_HOOKS } from '@consts/runtimeModules';
import { recordImport } from '@shared/runtime-utils';
import { ScriptBlockIR } from '.';
import { buildUseState$ } from './builders/react-hook-builder';
import { reactHookVarDecl } from './builders/react-hook-declarator';
import { checkNodeIsInBlock, getVarKind } from './shared/babel-utils';
import { reactiveVarDecl } from './shared/reactive-variable-declarator';

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
  const { node } = path;

  reactiveVarDecl.init(node);

  const kind = getVarKind(path);
  const varName = reactiveVarDecl.varName();
  const apiName = reactiveVarDecl.apiName();
  const apiArgs = reactiveVarDecl.apiArgs();
  const useState$Api = adaptApis[apiName as keyof typeof adaptApis];

  if (!useState$Api) return;

  checkNodeIsInBlock(path);
  recordImport(RuntimeModules.RV3_HOOKS, useState$Api, true);

  if (!varName) {
    path.replaceWith(buildUseState$(apiArgs));
    return;
  }

  const { parameters, annotation } = reactiveVarDecl.apiTSTypes();
  const newNode = reactHookVarDecl.useState$(kind, varName, apiArgs, {
    isShallow: varName.startsWith('shallow'),
    varType: reactiveVarDecl.varType(),
    callTypeParameters: parameters,
    callTypeAnnotation: annotation,
  });

  path.replaceWith(newNode);
}
