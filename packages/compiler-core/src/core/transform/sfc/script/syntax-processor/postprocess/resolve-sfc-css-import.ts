import * as t from '@babel/types';
import { ICompilationContext } from '@compiler/context/types';
import { normalizePath } from '@shared/path';
import { getScriptIR } from '../..';

/**
 * 处理 SFC 的附属 css 产物 import 注入
 */
export function resolveSfcCssImport(ctx: ICompilationContext) {
  // 只有 sfc 文件才需要注入附属 css 产物的 import
  if (ctx.inputType !== 'sfc') return;

  const scriptIR = getScriptIR(ctx);
  const { filePath, moduleName } = ctx.styleData;

  if (!filePath) return;

  // 从 style 文件路径提取文件名
  const styleFilename = normalizePath(filePath).split('/').pop();

  // 生成 import 语句
  const importDecl = t.importDeclaration(
    !moduleName ? [] : [t.importDefaultSpecifier(t.identifier(moduleName))],
    t.stringLiteral(`./${styleFilename}`),
  );

  scriptIR.imports.push(importDecl);
}
