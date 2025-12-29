import { ParseResult } from '@babel/core';
import { TraverseOptions } from '@babel/traverse';
import { __scriptBlockIR } from '../..';

export function splitScriptBlocks(): TraverseOptions {
  return {
    ImportDeclaration(path) {
      __scriptBlockIR.imports.push(path.node);
      path.remove();
    },

    TSInterfaceDeclaration(path) {},
  };
}

// 不参与 babel traverse 的遍历
export function splitMainBody(ast: ParseResult) {
  __scriptBlockIR.body = ast.program.body;
}
