import { NodePath } from '@babel/core';
import { TraverseOptions } from '@babel/traverse';
import * as t from '@babel/types';
import { compileContext } from '@shared/compile-context';
import { React_Hooks } from '@src/consts/runtimeModules';
import {
  isVariableDeclTopLevel,
  replaceCallName,
  setNodeExtensionMeta,
} from '../../shared/babel-utils';

export function processTemplateNodeRef(): TraverseOptions {
  return {
    VariableDeclarator(path) {
      transformNodeRefToUseRef(path);
    },
  };
}

function transformNodeRefToUseRef(path: NodePath<t.VariableDeclarator>) {
  const {
    node: { id, init },
  } = path;
  const { templateVar } = compileContext.context;
  templateVar.refs.add('elRef');
  if (!isVariableDeclTopLevel(path) || !t.isIdentifier(id)) {
    return;
  }

  if (!templateVar.refs.has(id.name) || !t.isCallExpression(init)) {
    return;
  }

  replaceCallName(init, React_Hooks.useRef);
  setNodeExtensionMeta(path.node, { isUseRef: true, isReactive: false, reactiveType: 'none' });
}
