import { NodePath } from '@babel/core';
import { TraverseOptions } from '@babel/traverse';
import * as t from '@babel/types';
import { ICompilationContext } from '@compiler/context/types';
import { ReactApis, RuntimeModules } from '@src/consts/runtimeModules';
import { recordImport } from '@src/core/transform/shared/setup-runtime-utils';
import { isReactiveBinding } from '../../shared/analyze-dependency';
import {
  getNodeExtensionMeta,
  isRealVariableAccess,
  isVariableDeclTopLevel,
  setNodeExtensionMeta,
} from '../../shared/babel-utils';

export function optimizeConstant(ctx: ICompilationContext): TraverseOptions {
  return {
    VariableDeclarator(path) {
      transformToUseRef(ctx, path);
    },

    // Merry christmas! 2025-12-25 19:43
    Identifier(path) {
      transformToUseRefAccess(path);
    },
  };
}

function transformToUseRef(ctx: ICompilationContext, path: NodePath<t.VariableDeclarator>) {
  const { node, parent, parentPath } = path;

  if (
    !t.isVariableDeclaration(parent) ||
    !isVariableDeclTopLevel(parentPath) ||
    parent.kind !== 'const' ||
    isReactiveBinding(parent) ||
    isReactiveBinding(node)
  ) {
    return;
  }

  node.init = t.callExpression(t.identifier(ReactApis.useRef), [node.init!]);

  recordImport(ctx, RuntimeModules.REACT, ReactApis.useRef, true);
  setNodeExtensionMeta(node, { isUseRef: true, isReactive: false, reactiveType: 'none' });
}

function transformToUseRefAccess(path: NodePath<t.Identifier>) {
  if (!isRealVariableAccess(path)) return;

  const { node } = path;
  const binding = path.scope.getBinding(node.name);

  if (!binding) return;

  const meta = getNodeExtensionMeta(binding.path.node);

  if (!meta?.isUseRef) return;

  const newAccessName = `${node.name}.current`;

  node.name = newAccessName;
  node.loc!.identifierName = newAccessName;
}
