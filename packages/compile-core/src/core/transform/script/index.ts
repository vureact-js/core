import { traverse } from '@babel/core';
import { ParseResult } from '@babel/parser';
import { transformComputed } from './computed';
import { transformFunction } from './function';
import { transformReactive } from './reactive';
import { transformReadonly } from './readonly';
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

    Function(path) {
      transformFunction(path);
    },
  });

  return ast;
}
