import { ParseResult } from '@babel/core';
import { TraverseOptions } from '@babel/traverse';
import * as t from '@babel/types';
import { __scriptBlockIR } from '../..';
import { getNodeExtensionMeta, isVariableDeclTopLevel } from '../../shared/babel-utils';

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

    // 处理顶级变量声明
    VariableDeclaration(path) {
      if (!isVariableDeclTopLevel(path)) return;

      // 确保不属于“响应式”属性
      const globalVar = path.node.declarations.every((node) => !getNodeExtensionMeta(node));
      if (!globalVar) return;

      __scriptBlockIR.statement.global.push(path.node);
      path.remove();
    },
  };
}

// 收集剩下的主代码
export function splitMainBody(ast: ParseResult) {
  const { statement } = __scriptBlockIR;
  statement.local = ast.program.body;
}
