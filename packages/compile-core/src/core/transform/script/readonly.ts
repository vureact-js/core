import { NodePath, types as t, traverse } from '@babel/core';
import { RuntimeModules, RV3_HOOKS } from '@consts/runtimeModules';
import { recordImport } from '@shared/runtime-utils';
import { ScriptBlockIR } from '.';
import { buildUseReadonly } from './builders/react-hook-builder';
import { reactHookVarDecl } from './builders/react-hook-declarator';
import { checkNodeIsInBlock, getVarKind } from './shared/babel-utils';
import { reactiveVarDecl } from './shared/reactive-variable-declarator';

const adaptApis = {
  readonly: RV3_HOOKS.useReadonly,
  shallowReadonly: RV3_HOOKS.useShallowReadonly,
} as const;

export function transformReadonly(ast: ScriptBlockIR) {
  traverse(ast, {
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
  const useReadonlyApi = adaptApis[apiName as keyof typeof adaptApis];

  if (!useReadonlyApi) return;

  checkNodeIsInBlock(path);
  recordImport(RuntimeModules.RV3_HOOKS, useReadonlyApi, true);

  if (!varName) {
    path.replaceWith(buildUseReadonly(apiArgs));
    return;
  }

  const { parameters, annotation } = reactiveVarDecl.apiTSTypes();
  const newNode = reactHookVarDecl.useReadonly(kind, varName, apiArgs, {
    isShallow: varName.startsWith('shallow'),
    varType: reactiveVarDecl.varType(),
    callTypeParameters: parameters,
    callTypeAnnotation: annotation,
  });

  path.replaceWith(newNode);
}
