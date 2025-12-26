import { traverse } from '@babel/core';
import { TraverseOptions } from '@babel/traverse';
import { ScriptBlockIR } from '..';

interface ProcessOptions<T = ProcessFunction> {
  preprocess: T[];
  processMain: T[];
  postprocess: T[];
}

type ProcessFunction = () => TraverseOptions;

export function processVueSyntax(ast: ScriptBlockIR, options: ProcessOptions) {
  const { preprocess, processMain, postprocess } = options;

  // 按预定顺序执行流水线
  pipeline(ast, preprocess);
  pipeline(ast, processMain);
  pipeline(ast, postprocess);
}

function pipeline(ast: ScriptBlockIR, pipelines: ProcessFunction[]) {
  for (const visitor of pipelines) {
    traverse(ast, visitor());
  }
}
