import { ParseResult } from '@babel/parser';
import * as t from '@babel/types';
import { optimizeConstant } from './optimizations/constant';
import { optimizeFunction } from './optimizations/function';
import { processVueSyntax } from './syntax-processor';
import { processComputedApi } from './syntax-processor/main-process/computed';
import { processDefinePropsEmitsApi } from './syntax-processor/main-process/define-props-emits';
import { processLifecycleApi } from './syntax-processor/main-process/lifecycle';
import { processReactiveApi } from './syntax-processor/main-process/reactive';
import { processReadonlyApi } from './syntax-processor/main-process/readonly';
import { processWatchApi } from './syntax-processor/main-process/watch';
import { processWatchEffectApi } from './syntax-processor/main-process/watchEffect';
import { insertRequiredImports } from './syntax-processor/post-process/insert-required-imports';
import { processReactiveValueUpdate } from './syntax-processor/post-process/reactive-value-update';
import { splitMainBody, splitScriptBlocks } from './syntax-processor/post-process/script-blocks';
import { stripReactiveValueSuffix } from './syntax-processor/pre-process/strip-value-suffix';
import { processTemplateNodeRef } from './syntax-processor/pre-process/template-node-ref';

export interface ScriptBlockIR {
  imports: t.ImportDeclaration[];
  exports: t.ExportDeclaration[];
  tsTypes: t.TypeScript[];
  defineProp: {
    multiple: boolean; // 代表使用了多个 defineProps/defineEmits 进行定义
    items: DefinePropItem[];
  };
  body: t.Statement[];
}

export interface DefinePropItem {
  id: t.Identifier;
  exp: t.SpreadElement | t.ObjectPattern;
  tsType: t.TSTypeParameterInstantiation | null | undefined;
}

export const __scriptBlockIR = createIR();

export function transformScript(ast?: ParseResult): ScriptBlockIR | null {
  if (!ast) return null;

  processVueSyntax(ast, {
    preprocess: [stripReactiveValueSuffix, processDefinePropsEmitsApi, processTemplateNodeRef],

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
    ],

    postprocess: [
      processReactiveValueUpdate,
      optimizeConstant,
      insertRequiredImports,
      splitScriptBlocks,
    ],
  });

  splitMainBody(ast);

  return __scriptBlockIR;
}

function createIR(): ScriptBlockIR {
  return {
    imports: [],
    exports: [],
    tsTypes: [],
    defineProp: { multiple: false, items: [] },
    body: [],
  };
}
