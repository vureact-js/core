import { ParseResult, traverse } from '@babel/core';
import { TraverseOptions } from '@babel/traverse';
import { ICompilationContext } from '@compiler/context/types';

interface ProcessOptions {
  traversal: ProcessFuncOpts<TraversalFunc>;
  skipTraversal?: ProcessFuncOpts<SkipTraversalFunc>;
}

interface ProcessFuncOpts<T> {
  preprocess?: T[];
  processMain?: T[];
  postprocess?: T[];
}

type SkipTraversalFunc = (ctx: ICompilationContext, ast: ParseResult) => void;

type TraversalFunc = (ctx: ICompilationContext, ast: ParseResult) => TraverseOptions;

export function processVueScript(
  ctx: ICompilationContext,
  ast: ParseResult,
  options: ProcessOptions,
) {
  const { traversal, skipTraversal } = options;

  // 按预定顺序执行流水线
  pipeline(ctx, ast, skipTraversal?.preprocess);
  pipeline(ctx, ast, traversal.preprocess, true);

  pipeline(ctx, ast, skipTraversal?.processMain);
  pipeline(ctx, ast, traversal.processMain, true);

  pipeline(ctx, ast, traversal.postprocess, true);
  pipeline(ctx, ast, skipTraversal?.postprocess);
}

function pipeline(
  ctx: ICompilationContext,
  ast: ParseResult,
  pipelines?: (TraversalFunc | SkipTraversalFunc)[],
  needsTraverse: boolean = false,
) {
  if (!pipelines?.length) return;

  for (const handler of pipelines) {
    if (!needsTraverse) {
      handler(ctx, ast);
    } else {
      traverse(ast, handler(ctx, ast) as TraverseOptions);
    }
  }
}
