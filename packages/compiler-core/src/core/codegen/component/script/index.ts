import * as t from '@babel/types';
import { ICompilationContext } from '@compiler/context/types';
import { ScriptBlockIR } from '@src/core/transform/sfc/script';
import { JSXChild } from '../jsx/types';
import { buildScriptSyntax } from './syntax-processor';

export function buildScript(
  nodeIR: ScriptBlockIR | null,
  ctx: ICompilationContext,
  jsx: JSXChild | null,
  expose = true,
): t.Program {
  return buildScriptSyntax(nodeIR, ctx, jsx, expose);
}
