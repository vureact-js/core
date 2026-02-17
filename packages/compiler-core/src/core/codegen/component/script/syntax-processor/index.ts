import * as t from '@babel/types';
import { ICompilationContext } from '@compiler/context/types';
import { ScriptBlockIR } from '@src/core/transform/sfc/script';
import { JSXChild } from '../../jsx/types';
import { buildProgramNodeProcessor } from './postprocess';
import { buildComponentFunctionProcessor, buildProgramPreambleProcessor } from './process';

interface ProcessorOptions {
  preprocess: ScriptProcessor[];
  process: ScriptProcessor[];
  postprocess: ScriptProcessor[];
}

export interface ScriptBuildState {
  jsx: JSXChild | null;
  expose: boolean;
  preambleStatements: t.Statement[];
  componentFunction: t.FunctionExpression | null;
  result: t.Program | null;
}

export type ScriptProcessor = (
  nodeIR: ScriptBlockIR | null,
  ctx: ICompilationContext,
  state: ScriptBuildState,
) => void;

export function buildScriptSyntax(
  nodeIR: ScriptBlockIR | null,
  ctx: ICompilationContext,
  jsx: JSXChild | null,
  expose = true,
): t.Program {
  const state: ScriptBuildState = {
    jsx,
    expose,
    preambleStatements: [],
    componentFunction: null,
    result: null,
  };

  scriptSyntaxProcessor(nodeIR, ctx, state, {
    preprocess: [],
    process: [buildProgramPreambleProcessor, buildComponentFunctionProcessor],
    postprocess: [buildProgramNodeProcessor],
  });

  return state.result || t.program([], undefined, 'module');
}

function scriptSyntaxProcessor(
  nodeIR: ScriptBlockIR | null,
  ctx: ICompilationContext,
  state: ScriptBuildState,
  options: ProcessorOptions,
) {
  const run = (p: ScriptProcessor[]) => {
    p.forEach((handler) => handler(nodeIR, ctx, state));
  };

  run(options.preprocess);
  run(options.process);
  run(options.postprocess);
}
