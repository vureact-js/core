import { traverse } from '@babel/core';
import { ScriptBlockIR } from '..';
import { transformComputed } from './computed';
import { transformReactive } from './reactive';
import { transformReadonly } from './readonly';
import { transformToRef } from './toRef';

export function handleVueApiVariableDecl(ast: ScriptBlockIR) {
  traverse(ast, {
    VariableDeclarator(path) {
      transformReactive(path);
      transformComputed(path);
      transformReadonly(path);
      transformToRef(path);
    },
  });
}
