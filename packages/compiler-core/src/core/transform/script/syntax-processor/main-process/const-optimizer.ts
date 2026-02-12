import { NodePath } from '@babel/core';
import { TraverseOptions } from '@babel/traverse';
import * as t from '@babel/types';
import { ICompilationContext } from '@compiler/context/types';
import { PACKAGE_NAME } from '@consts/other';
import { REACT_API_MAP } from '@src/consts/react-api-map';
import { recordImport } from '@src/core/transform/shared/record-import';
import {
  getNodeExtensionMeta,
  isRealVariableAccess,
  isVariableDeclTopLevel,
  setNodeExtensionMeta,
} from '../../shared/babel-utils';
import { isReactiveBinding } from '../../shared/dependency-analyzer';

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

  node.init = t.callExpression(t.identifier(REACT_API_MAP.useRef), [node.init!]);

  recordImport(ctx, PACKAGE_NAME.react, REACT_API_MAP.useRef);
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
