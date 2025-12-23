import { NodePath, types as t } from '@babel/core';
import { RuntimeModules, RV3_HOOKS } from '@consts/runtimeModules';
import { compileContext } from '@shared/compile-context';
import { logger } from '@shared/logger';
import { recordImport } from '@shared/runtime-utils';
import { reactHookBuilder } from './builders/react-hook-builder';
import { reactHookVarDecl } from './builders/react-hook-variable-declaration';
import { varDeclCallExp } from './shared/destructure-var-decl-call-exp';
import { CallExpArgs, ReactiveTypes } from './shared/types';
import { warnVueHookInBlock } from './shared/unsupported-warn';

const adaptApis = {
  toRef: RV3_HOOKS.useState$,
} as const;

const allowedCallList = ['ref', 'toRefs', 'shallowRef', 'reactive', 'shallowReactive'];

export function transformToRef(path: NodePath<t.VariableDeclarator>) {
  const result = varDeclCallExp.destructure(path);
  const useState$Api = adaptApis[result.callExpName as keyof typeof adaptApis];

  if (!useState$Api || !result.name) return;

  warnVueHookInBlock(path);
  recordImport(RuntimeModules.RV3_HOOKS, useState$Api, true);

  handleArgs(result.callExpArgs);

  const newNode = reactHookVarDecl.useState$({
    ...result,
    reactiveType: result.callExpName as ReactiveTypes,
    shallow: result.name.startsWith('shallow'),
  });

  path.replaceWith(newNode);
}

export function transformUndeclaredToRefCall(path: NodePath<t.CallExpression>) {
  const { callee, arguments: args } = path.node;

  if (t.isIdentifier(callee) && callee.name in adaptApis) {
    warnVueHookInBlock(path);
    recordImport(RuntimeModules.RV3_HOOKS, RV3_HOOKS.useState$, true);
    handleArgs(args);
    path.replaceWith(reactHookBuilder.useState$(args));
  }
}

function handleArgs(args: CallExpArgs) {
  const [obj, key] = args;

  if (!key) return;

  let keyId;

  if (t.isStringLiteral(key)) {
    keyId = t.identifier(key.value);
  } else if (t.isIdentifier(key)) {
    keyId = key;
  } else {
    keyId = t.identifier(String(key));
  }

  if (
    t.isIdentifier(obj) ||
    (t.isCallExpression(obj) &&
      t.isIdentifier(obj.callee) &&
      allowedCallList.includes(obj.callee.name))
  ) {
    args.length = 0;
    args.push(t.memberExpression(obj, keyId));
  } else {
    const { source, filename } = compileContext.context;
    logger.warn(`Expected an object variable identifier or reactive API call.`, {
      source,
      file: filename,
      loc: obj!.loc!,
    });
  }
}
