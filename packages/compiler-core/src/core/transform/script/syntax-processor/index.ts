import { ParseResult, traverse } from '@babel/core';
import { TraverseOptions } from '@babel/traverse';

interface ProcessOptions {
  traversal: ProcessFuncOpts<TraversalFunc>;
  skipTraversal?: ProcessFuncOpts<SkipTraversalFunc>;
}

interface ProcessFuncOpts<T> {
  preprocess?: T[];
  processMain?: T[];
  postprocess?: T[];
}

type SkipTraversalFunc = (ast: ParseResult) => void;

type TraversalFunc = (ast: ParseResult) => TraverseOptions;

export function processVueSyntax(ast: ParseResult, options: ProcessOptions) {
  const { traversal, skipTraversal } = options;

  // 按预定顺序执行流水线
  pipeline(ast, skipTraversal?.preprocess);
  pipeline(ast, traversal.preprocess, true);
  pipeline(ast, traversal.processMain, true);
  pipeline(ast, traversal.postprocess, true);
  pipeline(ast, skipTraversal?.postprocess);
}

function pipeline(
  ast: ParseResult,
  pipelines?: (TraversalFunc | SkipTraversalFunc)[],
  needsTraverse: boolean = false,
) {
  if (!pipelines?.length) return;

  for (const handler of pipelines) {
    if (!needsTraverse) {
      handler(ast);
    } else {
      traverse(ast, handler(ast) as TraverseOptions);
    }
  }
}
