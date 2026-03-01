import { ParseResult as BabelParseResult, traverse } from '@babel/core';
import { TraverseOptions } from '@babel/traverse';
import { ICompilationContext } from '@compiler/context/types';
import {
  collectLocalStatements,
  insertCSSImport,
  insertRequiredImports,
  resolveStaticHoisting,
} from './postprocess';
import {
  resolveAsyncComponent,
  resolveCompIProps,
  resolveEmitCalls,
  resolveEmitsTopLevelTypes,
  resolveOptions,
  resolvePropsIface,
  resolveSlotsTopLevelTypes,
  resolveTemplateRef,
  resolveTemplateSlotIface,
} from './preprocess';
import {
  lintRules,
  resolveArrowFnDeps,
  resolveExprMemo,
  resolveProvide,
  resolveRenameOnlyAdapter,
  resolveTransformAdapter,
  resolveUnanalyzedArrow,
} from './process';

interface ProcessorOptions {
  preprocess: ProcessorConfig;
  process: ProcessorConfig;
  postprocess: ProcessorConfig;
}

interface ProcessorConfig {
  /** 处理器需依赖于 babel 的 traverse 函数进行调用 */
  applyBabel?: Array<(ctx: ICompilationContext, ast: BabelParseResult) => TraverseOptions>;
  excludeBabel?: Array<(ctx: ICompilationContext, ast: BabelParseResult) => void>;
}

export function processVueSyntax(ast: BabelParseResult, ctx: ICompilationContext) {
  vueSyntaxProcessor(ast, ctx, {
    preprocess: {
      applyBabel: [
        resolveOptions,
        resolveEmitsTopLevelTypes,
        resolveSlotsTopLevelTypes,
        resolvePropsIface,
        resolveAsyncComponent,
        resolveEmitCalls,
      ],
    },

    process: {
      applyBabel: [
        resolveRenameOnlyAdapter,
        resolveArrowFnDeps,
        resolveUnanalyzedArrow,
        resolveTransformAdapter,
        resolveTemplateRef,
        resolveProvide,
        resolveExprMemo,
        lintRules,
      ],
      excludeBabel: [resolveTemplateSlotIface, resolveCompIProps],
    },

    postprocess: {
      applyBabel: [insertRequiredImports, resolveStaticHoisting],
      excludeBabel: [insertCSSImport, collectLocalStatements],
    },
  });
}

function vueSyntaxProcessor(
  ast: BabelParseResult,
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
