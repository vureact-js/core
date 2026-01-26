import * as t from '@babel/types';
import { ICompilationContext } from '@compiler/context/types';
import { normalizePath, relativePath } from '@shared/path';
import { __scriptBlockIR } from '../..';

export function insertCSSImport(ctx: ICompilationContext) {
  const { filePath, moduleName } = ctx.styleData;

  const source = relativePath(normalizePath(filePath));

  const importDecl = t.importDeclaration(
    !moduleName ? [] : [t.importDefaultSpecifier(t.identifier(moduleName))],
    t.stringLiteral(source),
  );

  __scriptBlockIR.imports.push(importDecl!);
}
