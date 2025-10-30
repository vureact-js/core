import * as t from '@babel/types';
import type { ParsedResult } from '@parse/types';
import { isNull } from '@utils/types';
import { mergeImports, mergeIntoComponent, mergePropsEmits } from './merge';
import { transformScript } from './transform-script';
import { processImports as processScriptImports } from './transform-script/processImports';
import { transformTemplate } from './transform-template';
import { logger } from './utils/logger';

export default function transformer(vueAST: ParsedResult): t.File {
  const jsxAST = transformTemplate(vueAST);
  const scriptAST = transformScript(vueAST);

  const imports = mergeImports(jsxAST?.context.imports, scriptAST?.context.imports);
  const propDefinition = mergePropsEmits(vueAST.componentName, scriptAST?.context);
  const componentAST = mergeIntoComponent(
    vueAST,
    jsxAST?.ast,
    scriptAST?.ast,
    !isNull(propDefinition),
  );

  const fileAST = fileWrapper(vueAST.filename, componentAST);

  if (!isNull(propDefinition)) {
    fileAST.program.body.unshift(propDefinition);
  }
  if (!isNull(imports)) {
    processScriptImports(fileAST, imports);
  }

  logger.printAll();

  return fileAST;
}

function fileWrapper(filename: string, decl: t.ExportDefaultDeclaration): t.File {
  const file = t.file(t.program([decl]), [], null);
  t.addComment(file, 'leading', `Compiled from ${filename}`, true);
  return file;
}
