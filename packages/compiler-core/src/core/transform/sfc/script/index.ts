import { parse as babelParse, ParseResult as BabelParseResult } from '@babel/parser';
import * as t from '@babel/types';
import { ICompilationContext } from '@compiler/context/types';
import { processVueSyntax } from './syntax-processor';

export interface ScriptBlockIR {
  /** Transformed full script AST (used for script-only input). */
  scriptAST?: BabelParseResult;
  imports: t.ImportDeclaration[];
  exports: t.ExportDeclaration[];
  tsTypes: t.TypeScript[];
  /** Executable statements extracted from script block. */
  statement: {
    /** Statements hoisted outside component function. */
    global: t.Node[];
    /** Statements kept inside component function. */
    local: BabelParseResult<t.File> | null;
  };
}

const SCRIPT_IR_KEY = '__vureact_script_block_ir';

export function resolveScript(
  ast: BabelParseResult | undefined,
  ctx: ICompilationContext,
): ScriptBlockIR {
  const scriptIR = createScriptIR();

  //  每次创建新的 ir，防止不同编译间的数据共享
  setScriptIR(ctx, scriptIR);

  if (!ast) {
    // Keep pipeline stable for SFCs without script.
    ast = babelParse('// No script');
  }

  processVueSyntax(ast, ctx);

  if (ctx.inputType !== 'sfc') {
    scriptIR.scriptAST = ast;
  }

  return scriptIR;
}

export function getScriptIR(ctx: ICompilationContext): ScriptBlockIR {
  const ir = (ctx.scriptData as any)[SCRIPT_IR_KEY] as ScriptBlockIR | undefined;

  if (!ir) {
    throw new Error('Script IR is not initialized for current compilation context');
  }

  return ir;
}

function setScriptIR(ctx: ICompilationContext, ir: ScriptBlockIR): void {
  (ctx.scriptData as any)[SCRIPT_IR_KEY] = ir;
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
