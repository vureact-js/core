import { ICompilationContext } from '@compiler/context/types';
import { TemplateBlockIR } from '@src/core/transform/sfc/template';
import { JSXChild } from '../types';
import { buildRootJsxProcessor } from './postprocess';
import { buildJsxChildrenProcessor } from './process';

interface ProcessorOptions {
  preprocess: JsxProcessor[];
  process: JsxProcessor[];
  postprocess: JsxProcessor[];
}

export interface JsxBuildState {
  rootChildren: JSXChild[];
  result: JSXChild | null;
}

export type JsxProcessor = (
  nodeIR: TemplateBlockIR,
  ctx: ICompilationContext,
  state: JsxBuildState,
) => void;

export function buildJSXChild(nodeIR: TemplateBlockIR, ctx: ICompilationContext): JSXChild | null {
  const state: JsxBuildState = {
    rootChildren: [],
    result: null,
  };

  jsxBuilder(nodeIR, ctx, state, {
    preprocess: [],
    process: [buildJsxChildrenProcessor],
    postprocess: [buildRootJsxProcessor],
  });

  return state.result;
}

function jsxBuilder(
  nodeIR: TemplateBlockIR,
  ctx: ICompilationContext,
  state: JsxBuildState,
  options: ProcessorOptions,
) {
  const run = (p: JsxProcessor[]) => {
    p.forEach((handler) => handler(nodeIR, ctx, state));
  };

  run(options.preprocess);
  run(options.process);
  run(options.postprocess);
}
