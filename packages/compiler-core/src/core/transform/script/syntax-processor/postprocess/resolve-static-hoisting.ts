import { ParseResult } from '@babel/core';
import { TraverseOptions } from '@babel/traverse';
import * as t from '@babel/types';
import { ICompilationContext } from '@compiler/context/types';
import { scriptBlockIR } from '../..';
import { isSimpleLiteral, isVariableDeclTopLevel } from '../../shared/babel-utils';
import { getScriptNodeMeta } from '../../shared/metadata-utils';

/**
 * 解决不属于组件内的语句，将其静态提升至组件外部
 */
export function resolveStaticHoisting(ctx: ICompilationContext): TraverseOptions {
  return {
    'ImportDeclaration|ExportDeclaration'(path) {
      if (t.isImportDeclaration(path.node)) {
        scriptBlockIR.imports.push(path.node);
      } else if (t.isExportDeclaration(path.node)) {
        scriptBlockIR.exports.push(path.node);
      }

      path.remove();
    },

    // 处理顶级类型声明
    'TSInterfaceDeclaration|TSTypeAliasDeclaration|TSEnumDeclaration|TSModuleDeclaration|TSModuleDeclaration'(
      path,
    ) {
      // 确保是顶级声明（父节点是 Program）
      if (t.isProgram(path.parent)) {
        scriptBlockIR.tsTypes.push(path.node as t.TypeScript);
        path.remove();
      }
    },

    VariableDeclarator(path) {
      const { node } = path;

      // 跳过非顶级变量声明、初始值非简单字面量、被标记了元数据的节点
      if (!isVariableDeclTopLevel(path) || !isSimpleLiteral(node.init) || getScriptNodeMeta(node)) {
        return;
      }

      // 查找声明根节点，如果存在才收集
      const declarationPath = path.findParent((p) => p.isVariableDeclaration());
      if (!declarationPath) return;

      scriptBlockIR.statement.global.push(declarationPath.node);

      // 移除完整节点
      declarationPath.remove();
    },
  };
}

/**
 * 收集静态提升后的剩余语句，这些语句应放在组件内使用
 */
export function collectLocalStatements(_: ICompilationContext, ast: ParseResult) {
  const { statement } = scriptBlockIR;
  statement.local = ast;
}
