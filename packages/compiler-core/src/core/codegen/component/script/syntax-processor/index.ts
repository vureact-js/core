import * as t from '@babel/types';
import { ICompilationContext } from '@compiler/context/types';
import { ScriptBlockIR } from '@transform/sfc/script';
import { JSXChild } from '../../jsx/types';
import { buildProgramNode } from './postprocess';
import { buildComponent, buildProgramPreamble } from './process';

interface ProcessorOptions {
  preprocess: ScriptProcessor[];
  process: ScriptProcessor[];
  postprocess: ScriptProcessor[];
}

export interface ScriptBuildState {
  jsx: JSXChild | null;
  expose: boolean;
  preambleStatements: t.Statement[];
  component: t.VariableDeclaration | null;
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
    component: null,
    result: null,
  };

  scriptSyntaxProcessor(nodeIR, ctx, state, {
    preprocess: [],
    process: [buildProgramPreamble, buildComponent],
    postprocess: [buildProgramNode],
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
