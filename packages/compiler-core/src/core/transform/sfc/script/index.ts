import { parse as babelParse, ParseResult as BabelParseResult } from '@babel/parser';
import * as t from '@babel/types';
import { ICompilationContext } from '@compiler/context/types';
import { processVueSyntax } from './syntax-processor';

export interface ScriptBlockIR {
  /** 转换后完整的 ast，没有经过切割 */
  scriptAST?: BabelParseResult;
  imports: t.ImportDeclaration[];
  exports: t.ExportDeclaration[];
  tsTypes: t.TypeScript[];
  /** 存放可执行 js 语句 */
  statement: {
    /**
     * 位于组件函数外的 script 语句
     */
    global: t.Node[];
    /**
     * 位于组件函数内的 script 语句
     */
    local: BabelParseResult<t.File> | null;
  };
}

export const scriptBlockIR = createScriptIR();

export function resolveScript(
  ast: BabelParseResult | undefined,
  ctx: ICompilationContext,
): ScriptBlockIR {
  if (!ast) {
    // 没有 script 内容的情况下，自动添加占位注释以确保转换流程正常运行
    const comments = '// No script';
    ast = babelParse(comments);
  }

  processVueSyntax(ast, ctx);

  if (ctx.inputType !== 'sfc') {
    // 处理纯 script 文件则接收整颗 ast
    scriptBlockIR.scriptAST = ast;
  }

  return scriptBlockIR;
}

function createScriptIR(): ScriptBlockIR {
  return {
    imports: [],
    exports: [],
    tsTypes: [],
    statement: {
      global: [],
      local: null,
    },
  };
}
