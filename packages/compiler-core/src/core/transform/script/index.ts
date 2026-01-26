import { ParseResult } from '@babel/parser';
import * as t from '@babel/types';
import { ICompilationContext } from '@compiler/context/types';
import { __props, ReactCompEvents, ReactCompProps, ReactCompSlots } from '../const';
import { optimizeFunction } from './optimizations/function';
import { processVueScript } from './syntax-processor';
import { processComputedApi } from './syntax-processor/main-process/computed';
import { processLifecycleApi } from './syntax-processor/main-process/lifecycle';
import { resolveProvideInject } from './syntax-processor/main-process/provide-inject';
import { processReactiveApi } from './syntax-processor/main-process/reactive';
import { processReadonlyApi } from './syntax-processor/main-process/readonly';
import { processWatchApi } from './syntax-processor/main-process/watch';
import { processWatchEffectApi } from './syntax-processor/main-process/watchEffect';
import { createPropsIntersectionType } from './syntax-processor/post-process/create-props-interface';
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
import { resolveProps } from './syntax-processor/pre-process/resolve-props';
import { processTemplateSlots } from './syntax-processor/pre-process/resolve-template-slots';
import { stripReactiveValueSuffix } from './syntax-processor/pre-process/strip-value-suffix';
import { processTemplateNodeRef } from './syntax-processor/pre-process/template-node-ref';

export interface ScriptBlockIR {
  imports: t.ImportDeclaration[];
  exports: t.ExportDeclaration[];
  tsTypes: t.TypeScript[];
  defineProps: {
    readonly id: t.TSTypeReference;
    typeAnnotation: {
      propsType: PropTSInterface;
      slotType: PropTSInterface;
      eventType: PropTSInterface;
    };
  };
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

export function transformScript(ctx: ICompilationContext, ast?: ParseResult): ScriptBlockIR | null {
  if (!ast) return null;

  processVueScript(ctx, ast, {
    traversal: {
      preprocess: [
        resolvesDefineOptions,
        resolveProps,
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
      preprocess: [processTemplateSlots],
      postprocess: [
        insertCSSImport,
        insertVModelEventHandlers,
        extractLocalStatements,
        createPropsIntersectionType,
      ],
    },
  });

  return __scriptBlockIR;
}

function createIR(): ScriptBlockIR {
  return {
    imports: [],
    exports: [],
    tsTypes: [],
    defineProps: {
      id: t.tsTypeReference(t.identifier(__props)),
      typeAnnotation: {
        propsType: {
          id: t.tsTypeReference(t.identifier(ReactCompProps)),
        },
        slotType: {
          id: t.tsTypeReference(t.identifier(ReactCompSlots)),
        },
        eventType: {
          id: t.tsTypeReference(t.identifier(ReactCompEvents)),
        },
      },
    },
    statement: {
      global: [],
      local: [],
    },
  };
}
