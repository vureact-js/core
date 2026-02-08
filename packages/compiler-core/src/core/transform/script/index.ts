import { parse as babelParse, ParseResult } from '@babel/parser';
import * as t from '@babel/types';
import { ICompilationContext } from '@compiler/context/types';
import { optimizeFunction } from './optimizations/function';
import { processVueSyntax } from './syntax-processor';
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
import {
  resolveSlotsTopLevelTypes,
  resolveTemplateSlotIface,
} from './syntax-processor/pre-process/resolve-props-interface/resolve-slot';
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

export const SCRIPT_IR = createScriptIR();

export function transformScript(ctx: ICompilationContext, ast?: ParseResult): ScriptBlockIR {
  if (!ast) {
    // 没有 script 的情况下，自动添加占位注释以确保转换流程正常运行
    ast = createDefaultAST();
  }

  // 处理 Vue 脚本语法
  processVueSyntax(ast, ctx, {
    preprocess: {
      applyBabel: [
        resolvesDefineOptions,
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

  return SCRIPT_IR;
}

function createScriptIR(): ScriptBlockIR {
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

function createDefaultAST(): ParseResult<t.File> {
  const comments =
    '// A placeholder comment is automatically inserted \n' +
    '// when no script block is present to ensure the processing pipeline works correctly. \n' +
    '// You can choose whether to remove it.';

  return babelParse(comments);
}
