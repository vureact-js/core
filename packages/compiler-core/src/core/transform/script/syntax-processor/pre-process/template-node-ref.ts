import { NodePath } from '@babel/core';
import { TraverseOptions } from '@babel/traverse';
import * as t from '@babel/types';
import { ICompilationContext } from '@compiler/context/types';
import { ReactApis, RuntimeModules } from '@src/consts/runtimeModules';
import { recordImport } from '@src/core/transform/shared/setup-runtime-utils';
import {
  isVariableDeclTopLevel,
  replaceCallName,
  setNodeExtensionMeta,
} from '../../shared/babel-utils';

export function processTemplateNodeRef(ctx: ICompilationContext): TraverseOptions {
  return {
    VariableDeclarator(path) {
      transformNodeRefToUseRef(ctx, path);
    },
  };
}

function transformNodeRefToUseRef(ctx: ICompilationContext, path: NodePath<t.VariableDeclarator>) {
  const {
    node: { id, init },
  } = path;
  const { templateData } = ctx;

  if (!isVariableDeclTopLevel(path) || !t.isIdentifier(id)) {
    return;
  }

  if (!templateData.refs.has(id.name) || !t.isCallExpression(init)) {
    return;
  }

  replaceCallName(init, ReactApis.useRef);
  recordImport(ctx, RuntimeModules.REACT, ReactApis.useRef, true);
  setNodeExtensionMeta(path.node, { isUseRef: true, isReactive: false, reactiveType: 'none' });
}
