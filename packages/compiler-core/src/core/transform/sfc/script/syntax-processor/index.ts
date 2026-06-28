import { ParseResult as BabelParseResult, traverse } from '@babel/core';
import { TraverseOptions } from '@babel/traverse';
import { ICompilationContext } from '@compiler/context/types';
import {
  resolveASTChunks,
  resolveRuntimeImports,
  resolveSfcCssImport,
  resolveVueTypeAsAny,
  resolveWithDefaults,
} from './postprocess';
import {
  resolveCompIProps,
  resolveDefineAsyncComponent,
  resolveDefineExpose,
  resolveDefineModel,
  resolveDefineOptions,
  resolveEmitCalls,
  resolveEmitsTopLevelTypes,
  resolvePropsIface,
  resolveTemplateSlotIface,
  resolveUseAttrs,
  resolveWithDefaultsOptions,
} from './preprocess';
import {
  resolveAnalysisOnlyAdapter,
  resolveArrowFnDeps,
  resolveElementRef,
  resolveExprMemo,
  resolveLintRules,
  resolveProvide,
  resolveRenameAdapter,
} from './process';

interface ProcessorOptions {
  preprocess: ProcessorConfig;
  process: ProcessorConfig;
  postprocess: ProcessorConfig;
}

interface ProcessorConfig {
  /**
   * 处理器需依赖于 babel 的 traverse 函数进行调用
   */
  applyBabel?: Array<(ctx: ICompilationContext, ast: BabelParseResult) => TraverseOptions>;

  /**
   * 不依赖于 babel 的 traverse。
   * 其中 excludeBabel.preprocess 和 excludeBabel.process 数组项的
   * 处理器先于 applyBabel 执行，postprocess 则反之。
   */
  excludeBabel?: Array<(ctx: ICompilationContext, ast: BabelParseResult) => void>;
}

export function processVueSyntax(ast: BabelParseResult, ctx: ICompilationContext) {
  vueSyntaxProcessor(ast, ctx, {
    preprocess: {
      applyBabel: [
        // feature: https://github.com/vureact-js/core/issues/63
        resolveWithDefaultsOptions,
        resolvePropsIface,
        resolveEmitsTopLevelTypes,
        resolveDefineOptions,
        resolveDefineExpose,
        resolveDefineAsyncComponent,
        resolveEmitCalls,
        // feature: https://github.com/vureact-js/core/issues/6
        resolveUseAttrs,
        // feature: https://github.com/vureact-js/core/issues/56
        resolveDefineModel,
      ],
    },

    process: {
      applyBabel: [
        resolveElementRef,
        resolveRenameAdapter,
        // fix: https://github.com/vureact-js/core/issues/46
        resolveProvide,
        // fix：在分析函数前分析可优化为 useMemo 的顶层变量声明，使得后续能够被函数依赖分析
        resolveExprMemo,
        resolveArrowFnDeps,
        resolveAnalysisOnlyAdapter,
        resolveLintRules,
      ],
      excludeBabel: [resolveTemplateSlotIface, resolveCompIProps],
    },

    postprocess: {
      applyBabel: [
        // feature: https://github.com/vureact-js/core/issues/63
        resolveWithDefaults,
        // 该 resolver 需确保放在所有类型处理之后，移除之前
        resolveVueTypeAsAny,
        resolveRuntimeImports,
        resolveASTChunks,
      ],
      excludeBabel: [resolveSfcCssImport],
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
