import { parse as babelParse, ParseResult } from '@babel/parser';
import * as t from '@babel/types';
import { ICompilationContext } from '@compiler/context/types';
import { processVueSyntax } from './syntax-processor';

export interface ScriptBlockIR {
  imports: t.ImportDeclaration[];
  exports: t.ExportDeclaration[];
  tsTypes: t.TypeScript[];
  /** 存放可执行 js 语句 */
  statement: {
    /**
     * 位于组件函数外的 script 语句
     */
    global: t.Statement[];
    /**
     * 位于组件函数内的 script 语句
     */
    local: t.Statement[];
  };
}

export const SCRIPT_IR = createScriptIR();

export function transformScript(ctx: ICompilationContext, ast?: ParseResult): ScriptBlockIR {
  if (!ast) {
    // 没有 script 的情况下，自动添加占位注释以确保转换流程正常运行
    ast = createDefaultAST();
  }

  processVueSyntax(ast, ctx);

  return SCRIPT_IR;
}

function createScriptIR(): ScriptBlockIR {
  return {
    imports: [],
    exports: [],
    tsTypes: [],
    statement: {
      global: [],
      local: [],
    },
  };
}

function createDefaultAST(): ParseResult<t.File> {
  const comments =
    '// A placeholder comment is automatically inserted \n' +
    '// when no script block is present to ensure the processing pipeline works correctly. \n' +
    '// You can choose whether to remove it.';

  return babelParse(comments);
}
