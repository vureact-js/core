import { ParseResult } from '@babel/core';
import { TraverseOptions } from '@babel/traverse';
import * as t from '@babel/types';
import { __scriptBlockIR } from '../..';

export function splitScriptBlocks(): TraverseOptions {
  return {
    ImportDeclaration(path) {
      __scriptBlockIR.imports.push(path.node);
      path.remove();
    },

    ExportDeclaration(path) {
      __scriptBlockIR.exports.push(path.node);
      path.remove();
    },

    // 处理顶级类型声明
    'TSInterfaceDeclaration|TSTypeAliasDeclaration|TSEnumDeclaration|TSModuleDeclaration|TSModuleDeclaration'(
      path,
    ) {
      // 确保是顶级声明（父节点是 Program）
      if (t.isProgram(path.parent)) {
        __scriptBlockIR.tsTypes.push(path.node as t.TypeScript);
        path.remove();
      }
    },
  };
}

// 不参与 babel traverse 的遍历
export function splitMainBody(ast: ParseResult) {
  __scriptBlockIR.body = ast.program.body;
}
