import { ParseResult, traverse } from '@babel/core';
import { TraverseOptions } from '@babel/traverse';
import { ICompilationContext } from '@compiler/context/types';
import { optimizeFunction } from '../optimizations/function';
import { processComputedApi } from './main-process/computed';
import { processLifecycleApi } from './main-process/lifecycle';
import { resolveProvideInject } from './main-process/provide-inject';
import { processReactiveApi } from './main-process/reactive';
import { processReadonlyApi } from './main-process/readonly';
import { processWatchApi } from './main-process/watch';
import { processWatchEffectApi } from './main-process/watchEffect';
import { insertCSSImport } from './post-process/insert-css-import';
import { insertRequiredImports } from './post-process/insert-required-imports';
import { insertVModelEventHandlers } from './post-process/insert-vmodel-handlers';
import { processReactiveValueUpdate } from './post-process/reactive-value-update';
import { extractLocalStatements, splitScriptBlocks } from './post-process/script-blocks';
import { resolveAsyncComponent } from './pre-process/resolve-async-component';
import { resolveOptions } from './pre-process/resolve-options';
import { resolveCompIProps, resolvePropsIface } from './pre-process/resolve-props-interface';
import { resolveEmitsTopLevelTypes } from './pre-process/resolve-props-interface/resolve-emits';
import {
  resolveSlotsTopLevelTypes,
  resolveTemplateSlotIface,
} from './pre-process/resolve-props-interface/resolve-slot';
import { stripReactiveValueSuffix } from './pre-process/strip-value-suffix';
import { processTemplateNodeRef } from './pre-process/template-node-ref';

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

export function processVueSyntax(ast: ParseResult, ctx: ICompilationContext) {
  vueSyntaxProcessor(ast, ctx, {
    preprocess: {
      applyBabel: [
        resolveOptions,
        resolveEmitsTopLevelTypes,
        resolveSlotsTopLevelTypes,
        resolvePropsIface,
        resolveAsyncComponent,
        stripReactiveValueSuffix,
        processTemplateNodeRef,
      ],
    },

    process: {
      applyBabel: [
        processReactiveApi,
        processReadonlyApi,
        processComputedApi,
        optimizeFunction,
        processWatchApi,
        processWatchEffectApi,
        processLifecycleApi,
        resolveProvideInject,
      ],
      excludeBabel: [resolveTemplateSlotIface, resolveCompIProps],
    },

    postprocess: {
      applyBabel: [processReactiveValueUpdate, insertRequiredImports, splitScriptBlocks],
      excludeBabel: [insertCSSImport, insertVModelEventHandlers, extractLocalStatements],
    },
  });
}

function vueSyntaxProcessor(ast: ParseResult, ctx: ICompilationContext, options: ProcessorOptions) {
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
