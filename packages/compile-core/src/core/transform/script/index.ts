import { traverse } from '@babel/core';
import { ParseResult } from '@babel/parser';
import { transformComputed, transformUndeclaredComputedCall } from './computed';
import { transformFunction } from './function';
import { transformLifecycle } from './lifecycle';
import { transformNextTick } from './nextTick';
import { transformReactive, transformUndeclaredReactiveCall } from './reactive';
import { transformReadonly, transformUndeclaredReadonlyCall } from './readonly';
import { stripReactiveValueSuffix } from './strip-value-suffix';
import { transformToRef, transformUndeclaredToRefCall } from './toRef';
import { transformWatch } from './watch';
import { tranformWatchEffect } from './watchEffect';

export type ScriptBlockIR = ParseResult;

export function transformScript(ast?: ParseResult): ScriptBlockIR | null {
  if (!ast) return null;

  stripReactiveValueSuffix(ast);

  traverse(ast, {
    VariableDeclarator(path) {
      transformReactive(path);
      transformComputed(path);
      transformReadonly(path);
      transformToRef(path);
    },

    CallExpression(path) {
      transformUndeclaredReactiveCall(path);
      transformUndeclaredComputedCall(path);
      transformUndeclaredReadonlyCall(path);
      transformUndeclaredToRefCall(path);

      transformWatch(path);
      tranformWatchEffect(path);
      transformLifecycle(path);
      transformNextTick(path);
    },

    Function(path) {
      transformFunction(path);
    },
  });

  return ast;
}
