import { ParseResult } from '@babel/parser';
import { optimizeConstant } from './optimizations/constant';
import { optimizeFunction } from './optimizations/function';
import { processVueSyntax } from './syntax-processor';
import { processComputedApi } from './syntax-processor/main-process/computed';
import { processLifecycleApi } from './syntax-processor/main-process/lifecycle';
import { processReactiveApi } from './syntax-processor/main-process/reactive';
import { processReadonlyApi } from './syntax-processor/main-process/readonly';
import { processWatchApi } from './syntax-processor/main-process/watch';
import { processWatchEffectApi } from './syntax-processor/main-process/watchEffect';
import { processReactiveValueUpdate } from './syntax-processor/post-process/reactive-value-update';
import { stripReactiveValueSuffix } from './syntax-processor/pre-process/strip-value-suffix';
import { processTemplateNodeRef } from './syntax-processor/pre-process/template-node-ref';

export type ScriptBlockIR = ParseResult;

export function transformScript(ast?: ParseResult): ScriptBlockIR | null {
  if (!ast) return null;

  processVueSyntax(ast, {
    preprocess: [stripReactiveValueSuffix, processTemplateNodeRef],

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

    postprocess: [processReactiveValueUpdate, optimizeConstant],
  });

  return ast;
}
