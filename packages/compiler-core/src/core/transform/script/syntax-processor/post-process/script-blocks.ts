import { ParseResult } from '@babel/core';
import { TraverseOptions } from '@babel/traverse';
import * as t from '@babel/types';
import { ICompilationContext } from '@compiler/context/types';
import { SCRIPT_IR } from '../..';
import { getNodeExtensionMeta, isVariableDeclTopLevel } from '../../shared/babel-utils';

export function splitScriptBlocks(): TraverseOptions {
  return {
    ImportDeclaration(path) {
      SCRIPT_IR.imports.push(path.node);
      path.remove();
    },

    ExportDeclaration(path) {
      SCRIPT_IR.exports.push(path.node);
      path.remove();
    },

    // 处理顶级类型声明
    'TSInterfaceDeclaration|TSTypeAliasDeclaration|TSEnumDeclaration|TSModuleDeclaration|TSModuleDeclaration'(
      path,
    ) {
      // 确保是顶级声明（父节点是 Program）
      if (t.isProgram(path.parent)) {
        SCRIPT_IR.tsTypes.push(path.node as t.TypeScript);
        path.remove();
      }
    },

    // 处理顶级变量声明
    VariableDeclaration(path) {
      if (!isVariableDeclTopLevel(path)) return;

      // 确保不属于“响应式”属性
      const globalVar = path.node.declarations.every((node) => !getNodeExtensionMeta(node));
      if (!globalVar) return;

      SCRIPT_IR.statement.global.push(path.node);
      path.remove();
    },
  };
}

/**
 * 提取 `splitScriptBlocks` 分割后的剩余语句，这些语句应放在组件内使用
 */
export function extractLocalStatements(_: ICompilationContext, ast: ParseResult) {
  const { statement } = SCRIPT_IR;
  statement.local = ast.program.body;
}
