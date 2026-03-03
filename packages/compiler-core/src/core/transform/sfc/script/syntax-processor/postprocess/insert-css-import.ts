import * as t from '@babel/types';
import { ICompilationContext } from '@compiler/context/types';
import { normalizePath } from '@shared/path';
import { getScriptIR } from '../..';

export function insertCSSImport(ctx: ICompilationContext) {
  if (ctx.inputType !== 'sfc') return;

  const { filePath, moduleName } = ctx.styleData;
  if (!filePath) return;

  const scriptIR = getScriptIR(ctx);
  const filename = normalizePath(filePath).split('/').pop();
  const importPath = `./${filename}`;

  const importDecl = t.importDeclaration(
    !moduleName ? [] : [t.importDefaultSpecifier(t.identifier(moduleName))],
    t.stringLiteral(importPath),
  );

  scriptIR.imports.push(importDecl);
}
