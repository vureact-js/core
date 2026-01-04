import { types as t } from '@babel/core';
import { NodePath } from '@babel/traverse';
import { compileContext } from '@src/shared/compile-context';
import { logger } from '@src/shared/logger';
import { __emits, __props } from '../../const';
import { isCalleeNamed, replaceCallName, setNodeExtensionMeta } from './babel-utils';
import { CallExpArgs, ReactiveTypes } from './types';
import {
  warnVueHookArguments,
  warnVueHookInAnyCallback,
  warnVueHookInBlock,
  warnVueHookWithoutDeclaration,
} from './unsupported-warn';

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

interface ProcessPropsOptions {
  onProcessed: (prop: PropDescribe) => void;
}

export type PropDescribe = {
  type: 'defineProps' | 'defineEmits';
  id: t.Identifier;
  arg: CallExpArgs;
  tsType: t.TSTypeParameterInstantiation | null | undefined;
};

export function createPropsProcessor(
  path: NodePath<t.CallExpression>,
  options: ProcessPropsOptions,
) {
  const { node, parentPath } = path;
  const { callee } = node;
  const { onProcessed } = options;
  const { source, filename } = compileContext.context;

  const warnUnexpectedVarName = (target: string, loc: any) => {
    const expect = (callee as t.Identifier).name === 'defineProps' ? __props : __emits;
    if (target !== expect) {
      logger.error(
        `You must assign the result to the controlled variable "${expect}". ` +
          'Do not use any other variable name',
        { source, file: filename, loc },
      );
    }
  };

  if (!isCalleeNamed(node, 'defineProps') && !isCalleeNamed(node, 'defineEmits')) {
    path.skip();
    return;
  }

  if (parentPath.isVariableDeclarator()) {
    const id = parentPath.node.id as t.Identifier;
    warnUnexpectedVarName(id.name, id.loc);
  } else {
    warnUnexpectedVarName('undefined', node.loc);
  }

  const prop = {
    type: (callee as t.Identifier).name as any,
    id: t.identifier(__props),
    arg: node.arguments,
    tsType: node.typeParameters,
  };

  onProcessed(prop);

  if (parentPath.isVariableDeclaration() || parentPath.isVariableDeclarator()) {
    parentPath.remove();
  } else {
    path.remove();
  }
}
