import { traverse } from '@babel/core';
import { ParseResult } from '@babel/parser';
import { transformComputed, transformUndeclaredComputedCall } from './computed';
import { transformFunction } from './function';
import { transformReactive, transformUndeclaredReactiveCall } from './reactive';
import { transformReadonly, transformUndeclaredReadonlyCall } from './readonly';
import { stripReactiveValueSuffix } from './strip-value-suffix';

export type ScriptBlockIR = ParseResult;

export function transformScript(ast?: ParseResult): ScriptBlockIR | null {
  if (!ast) return null;

  stripReactiveValueSuffix(ast);

  traverse(ast, {
    VariableDeclarator(path) {
      transformReactive(path);
      transformComputed(path);
      transformReadonly(path);
    },

    CallExpression(path) {
      transformUndeclaredReactiveCall(path);
      transformUndeclaredComputedCall(path);
      transformUndeclaredReadonlyCall(path);
    },

    Function(path) {
      transformFunction(path);
    },
  });

  return ast;
}
