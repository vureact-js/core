import { NodePath } from '@babel/core';
import { TraverseOptions } from '@babel/traverse';
import * as t from '@babel/types';
import { compileContext } from '@shared/compile-context';
import { reactHookBuilder } from '../builders/react-hook-builder';
import { isReactiveBinding } from '../shared/analyze-dependency';
import {
  getNodeExtensionMeta,
  isRealVariableAccess,
  isVariableDeclTopLevel,
  setNodeExtensionMeta,
} from '../shared/babel-utils';

export function optimizeConstant(): TraverseOptions {
  return {
    VariableDeclarator(path) {
      transformToUseRef(path);
    },

    // Merry christmas! 2025-12-25 19:43
    Identifier(path) {
      transformToUseRefAccess(path);
    },
  };
}

function transformToUseRef(path: NodePath<t.VariableDeclarator>) {
  const { node, parent, parentPath } = path;
  const { templateVar } = compileContext.context;

  if (!t.isVariableDeclaration(parent)) return;

  if (!isVariableDeclTopLevel(parentPath)) return;

  if (parent.kind !== 'const') return;

  if (isReactiveBinding(parent) || isReactiveBinding(node)) return;

  if (t.isIdentifier(node.id) && templateVar.ids.has(node.id.name)) return;

  node.init = reactHookBuilder.useRef([node.init!]);

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
