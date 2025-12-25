import { NodePath, traverse } from '@babel/core';
import * as t from '@babel/types';
import { compileContext } from '@shared/compile-context';
import { ScriptBlockIR } from '..';
import { reactHookBuilder } from '../builders/react-hook-builder';
import { isReactiveBinding } from '../shared/analyze-dependency';
import { isVariableDeclTopLevel, setNodeExtensionMeta } from '../shared/babel-utils';

export function optimizationConstant(ast: ScriptBlockIR) {
  traverse(ast, {
    VariableDeclarator(path) {
      transformToUseRef(path);
    },
  });
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

  setNodeExtensionMeta(parent, { isUseRef: true, isReactive: false, reactiveType: 'none' });
}
