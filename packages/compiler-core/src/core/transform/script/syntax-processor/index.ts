import { ParseResult, traverse } from '@babel/core';
import { TraverseOptions } from '@babel/traverse';
import { ICompilationContext } from '@compiler/context/types';

interface ProcessorOptions {
  preprocess: ProcessorConfig;
  process: ProcessorConfig;
  postprocess: ProcessorConfig;
}

interface ProcessorConfig {
  /** 处理器需依赖于 babel 的 traverse 函数进行调用 */
  applyBabel?: Array<(ctx: ICompilationContext, ast: ParseResult) => TraverseOptions>;
  excludeBabel?: Array<(ctx: ICompilationContext, ast: ParseResult) => void>;
}

export function processVueSyntax(
  ast: ParseResult,
  ctx: ICompilationContext,
  options: ProcessorOptions,
) {
  // 先执行普通处理函数，后执行依赖 babel 的处理函数
  const runExcludeThenApply = (cfg: ProcessorConfig) => {
    cfg.excludeBabel?.forEach((fn) => fn(ctx, ast));
    cfg.applyBabel?.forEach((fn) => traverse(ast, fn(ctx, ast)));
  };

  // 反之
  const runApplyThenExclude = (cfg: ProcessorConfig) => {
    cfg.applyBabel?.forEach((fn) => traverse(ast, fn(ctx, ast)));
    cfg.excludeBabel?.forEach((fn) => fn(ctx, ast));
  };

  // 按预定顺序执行流水线
  runExcludeThenApply(options.preprocess);
  runExcludeThenApply(options.process);
  runApplyThenExclude(options.postprocess);
}
