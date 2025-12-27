import { types as t } from '@babel/core';
import { NodePath } from '@babel/traverse';
import { replaceCallName, setNodeExtensionMeta } from '../../shared/babel-utils';
import { CallExpArgs, ReactiveTypes } from '../../shared/types';
import {
  warnVueHookArguments,
  warnVueHookInAnyCallback,
  warnVueHookInBlock,
  warnVueHookWithoutDeclaration,
} from '../../shared/unsupported-warn';

interface ProcessCallExpOptions {
  adaptApis: object;
  warnArguments?: boolean;
  warnInInAnyCallback?: boolean;
  warnWithoutDeclaration?: boolean;
  onProcessed: (adaptName: string) => void;
  handleVariableDeclarator?: (node: t.VariableDeclarator) => void;
  addDeps?: (fnBody: t.Expression, args: CallExpArgs) => t.ArrayExpression;
}

export function createCallExpProcessor(
  path: NodePath<t.CallExpression>,
  options: ProcessCallExpOptions,
) {
  const { node, parentPath } = path;
  const { callee, arguments: args } = node;

  if (!t.isIdentifier(callee)) return;

  const rawName = callee.name;

  const {
    addDeps,
    adaptApis,
    warnArguments,
    warnInInAnyCallback,
    warnWithoutDeclaration,
    handleVariableDeclarator,
  } = options;

  const adaptName = adaptApis[rawName as keyof typeof adaptApis];

  if (!adaptName) {
    path.skip();
    return;
  }

  warnVueHookInBlock(path);

  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  warnArguments && warnVueHookArguments(args);

  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  warnInInAnyCallback && warnVueHookInAnyCallback(path);

  if (parentPath.isVariableDeclarator()) {
    if (!handleVariableDeclarator) {
      setNodeExtensionMeta(parentPath.node, {
        isReactive: true,
        reactiveType: rawName as ReactiveTypes,
      });
    } else {
      handleVariableDeclarator(parentPath.node);
    }
  } else {
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    warnWithoutDeclaration && warnVueHookWithoutDeclaration(node.loc);
  }

  const fnBody = args[0] as t.Expression;
  const deps = addDeps?.(fnBody, args);

  if (deps) {
    node.arguments = [fnBody, deps];
  }

  replaceCallName(path.node, adaptName);

  options.onProcessed(adaptName);
}
