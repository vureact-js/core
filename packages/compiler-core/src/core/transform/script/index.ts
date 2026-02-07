import { parse as babelParse, ParseResult } from '@babel/parser';
import * as t from '@babel/types';
import { ICompilationContext } from '@compiler/context/types';
import { optimizeFunction } from './optimizations/function';
import { processVueScript } from './syntax-processor';
import { processComputedApi } from './syntax-processor/main-process/computed';
import { processLifecycleApi } from './syntax-processor/main-process/lifecycle';
import { resolveProvideInject } from './syntax-processor/main-process/provide-inject';
import { processReactiveApi } from './syntax-processor/main-process/reactive';
import { processReadonlyApi } from './syntax-processor/main-process/readonly';
import { processWatchApi } from './syntax-processor/main-process/watch';
import { processWatchEffectApi } from './syntax-processor/main-process/watchEffect';
import { insertCSSImport } from './syntax-processor/post-process/insert-css-import';
import { insertRequiredImports } from './syntax-processor/post-process/insert-required-imports';
import { insertVModelEventHandlers } from './syntax-processor/post-process/insert-vmodel-handlers';
import { processReactiveValueUpdate } from './syntax-processor/post-process/reactive-value-update';
import {
  extractLocalStatements,
  splitScriptBlocks,
} from './syntax-processor/post-process/script-blocks';
import { resolveAsyncComponent } from './syntax-processor/pre-process/resolve-async-component';
import { resolvesDefineOptions } from './syntax-processor/pre-process/resolve-define-options';
import {
  resolveCompIProps,
  resolvePropsIface,
} from './syntax-processor/pre-process/resolve-props-interface';
import { resolveEmitsTopLevelTypes } from './syntax-processor/pre-process/resolve-props-interface/resolve-emits';
import { resolveTemplateSlotIface } from './syntax-processor/pre-process/resolve-props-interface/resolve-slot';
import { stripReactiveValueSuffix } from './syntax-processor/pre-process/strip-value-suffix';
import { processTemplateNodeRef } from './syntax-processor/pre-process/template-node-ref';

export interface ScriptBlockIR {
  imports: t.ImportDeclaration[];
  exports: t.ExportDeclaration[];
  tsTypes: t.TypeScript[];
  /** 存放可执行 js 语句 */
  statement: {
    /**
     * 位于组件函数外的 script 语句
     */
    global: t.Statement[];
    /**
     * 位于组件函数内的 script 语句
     */
    local: t.Statement[];
  };
}

export type PropTSInterface = {
  readonly id: t.TSTypeReference;
  tsType?: t.TSInterfaceDeclaration | t.TSType | t.TSTypeAliasDeclaration;
};

export const __scriptBlockIR = createIR();

export function transformScript(ctx: ICompilationContext, ast?: ParseResult): ScriptBlockIR {
  // 没有 script 的情况下，自动添加占位注释以确保转换流程正常运行
  if (!ast) {
    const comments =
      '// A placeholder comment is automatically inserted \n' +
      '// when no script block is present to ensure the processing pipeline works correctly. \n' +
      '// You can choose whether to remove it.';

    ast = babelParse(comments);
  }

  processVueScript(ctx, ast, {
    traversal: {
      preprocess: [
        resolvesDefineOptions,
        resolveEmitsTopLevelTypes,
        resolvePropsIface,
        resolveAsyncComponent,
        stripReactiveValueSuffix,
        processTemplateNodeRef,
      ],

      processMain: [
        processReactiveApi,
        processReadonlyApi,
        processComputedApi,
        // optimizeFunction 必须放在处理响应式API和生命周期之间，起到承上启下的作用。
        // 因为需要分析顶层函数体内的响应式依赖，通过阶段标记识别，且变为 useCallback 后，
        // 也需被其他 hook 调用作为依赖项收集。
        optimizeFunction,
        processWatchApi,
        processWatchEffectApi,
        processLifecycleApi,
        resolveProvideInject,
      ],

      postprocess: [processReactiveValueUpdate, insertRequiredImports, splitScriptBlocks],
    },

    skipTraversal: {
      preprocess: [],
      processMain: [resolveTemplateSlotIface, resolveCompIProps],
      postprocess: [insertCSSImport, insertVModelEventHandlers, extractLocalStatements],
    },
  });

  return __scriptBlockIR;
}

function createIR(): ScriptBlockIR {
  return {
    imports: [],
    exports: [],
    tsTypes: [],
    statement: {
      global: [],
      local: [],
    },
  };
}
