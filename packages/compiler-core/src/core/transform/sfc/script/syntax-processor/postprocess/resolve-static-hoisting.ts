import { ParseResult } from '@babel/core';
import { TraverseOptions } from '@babel/traverse';
import * as t from '@babel/types';
import { ICompilationContext } from '@compiler/context/types';
import { getScriptIR } from '../..';
import { isSimpleLiteral, isVariableDeclTopLevel } from '../../shared/babel-utils';
import { getScriptNodeMeta } from '../../shared/metadata-utils';

/**
 * Hoist static statements out of component function for SFC scripts.
 */
export function resolveStaticHoisting(ctx: ICompilationContext): TraverseOptions {
  const scriptIR = getScriptIR(ctx);

  if (ctx.inputType !== 'sfc') {
    return {};
  }

  return {
    'ImportDeclaration|ExportDeclaration'(path) {
      if (t.isImportDeclaration(path.node)) {
        scriptIR.imports.push(path.node);
      } else if (t.isExportDeclaration(path.node)) {
        scriptIR.exports.push(path.node);
      }

      path.remove();
    },

    'TSInterfaceDeclaration|TSTypeAliasDeclaration|TSEnumDeclaration|TSModuleDeclaration|TSModuleDeclaration'(
      path,
    ) {
      if (t.isProgram(path.parent)) {
        scriptIR.tsTypes.push(path.node as t.TypeScript);
        path.remove();
      }
    },

    VariableDeclarator(path) {
      const { node } = path;

      if (!isVariableDeclTopLevel(path) || !isSimpleLiteral(node.init) || getScriptNodeMeta(node)) {
        return;
      }

      const declarationPath = path.findParent((p) => p.isVariableDeclaration());
      if (!declarationPath) return;

      scriptIR.statement.global.push(declarationPath.node);
      declarationPath.remove();
    },
  };
}

/**
 * Collect remaining local statements after static hoisting.
 */
export function collectLocalStatements(ctx: ICompilationContext, ast: ParseResult) {
  if (ctx.inputType !== 'sfc') return;

  const scriptIR = getScriptIR(ctx);
  scriptIR.statement.local = ast;
}
