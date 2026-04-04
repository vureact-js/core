import { ParseResult } from '@babel/core';
import { NodePath, TraverseOptions } from '@babel/traverse';
import * as t from '@babel/types';
import { ICompilationContext } from '@compiler/context/types';
import { getScriptIR } from '../../..';
import { resolveGlobalTypeChunks } from './resolve-global-type-chunk';
import { resolveModuleChunks } from './resolve-module-chunk';
import { resolveStaticConstChunks } from './resolve-static-const-chunk';

/**
 * 对最终的 AST 进行分块，包括组件内区域与全局区域
 */
export function resolveASTChunks(ctx: ICompilationContext, ast: ParseResult): TraverseOptions {
  const scriptIR = getScriptIR(ctx);

  if (ctx.inputType !== 'sfc') {
    return {};
  }

  // 提前将 AST 存入 local 块，
  // 后续做完其他提取后，被提取的块会从当前 AST 移除
  scriptIR.statement.local = ast;

  return {
    // 提取 import/export
    'ImportDeclaration|ExportDeclaration'(path) {
      resolveModuleChunks(path as NodePath<t.ImportDeclaration | t.ExportDeclaration>, scriptIR);
    },

    // 提取全局类型声明
    'TSInterfaceDeclaration|TSTypeAliasDeclaration|TSEnumDeclaration|TSModuleDeclaration|TSModuleDeclaration'(
      path,
    ) {
      resolveGlobalTypeChunks(path as NodePath<t.TypeScript>, scriptIR);
    },

    // 提升顶层常量声明
    VariableDeclarator(path) {
      resolveStaticConstChunks(path, scriptIR);
    },
  };
}
