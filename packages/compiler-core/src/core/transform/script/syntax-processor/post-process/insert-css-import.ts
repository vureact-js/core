import * as t from '@babel/types';
import { ICompilationContext } from '@compiler/context/types';
import { normalizePath } from '@shared/path';
import { __scriptBlockIR } from '../..';

export function insertCSSImport(ctx: ICompilationContext) {
  const { filePath, moduleName } = ctx.styleData;

  if (!filePath) return;

  const filename = normalizePath(filePath).split('/').pop();
  const path = `./${filename}`;

  const importDecl = t.importDeclaration(
    !moduleName ? [] : [t.importDefaultSpecifier(t.identifier(moduleName))],
    t.stringLiteral(path),
  );

  __scriptBlockIR.imports.push(importDecl!);
}
