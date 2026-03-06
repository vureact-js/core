import { ParseResult } from '@babel/parser';
import { TraverseOptions } from '@babel/traverse';
import * as t from '@babel/types';
import { ICompilationContext } from '@compiler/context/types';
import { MACRO_API_NAMES } from '@consts/other';
import { atComponentOrHookRoot } from '@shared/babel-utils';
import { logger } from '@shared/logger';

/**
 * 预校验即将转换成 React hook 的 Vue3 API 的使用是否符合 React 规范，
 * 以及宏定义和其他的一些 vureact 规范
 */
export function resolveLintRules(ctx: ICompilationContext, ast: ParseResult): TraverseOptions {
  const inScriptFile = ctx.inputType !== 'sfc';

  return {
    CallExpression(path) {
      const { node, parentPath } = path;

      if (!t.isIdentifier(node.callee)) return;

      const { name: callName } = node.callee;

      const addLog = (t: string) => {
        logger.error(t, {
          file: ctx.filename,
          source: ctx.scriptData.source,
          loc: node.loc,
        });
      };

      // 校验宏 API 使用位置
      const lintMacros = () => {
        const macro = Object.values(MACRO_API_NAMES).find((v) => v === callName);
        if (!macro) return;

        if (inScriptFile) {
          addLog(
            `The ${macro} can only be used inside Vue SFC <script> blocks, not in separate script files.`,
          );
          return;
        }

        if (!atComponentOrHookRoot(path, ast.program)) {
          addLog(
            `The ${macro} must be defined at the top level of the component, not inside blocks or functions.`,
          );
          return;
        }

        if (!parentPath.isVariableDeclarator()) {
          if (macro === MACRO_API_NAMES.props || macro === MACRO_API_NAMES.emits) {
            addLog(
              `The ${macro} macro must be assigned to a variable (e.g., const props = defineProps(...)).`,
            );
          }
        }
      };

      // 校验 Hook 使用位置
      const lintHooks = () => {
        if (!callName.startsWith('use')) return;

        // 现在 callName 已经是替换后的 hook 名了，不是原 API 名
        if (!atComponentOrHookRoot(path, ast.program, inScriptFile)) {
          addLog(
            `The ${callName} hook must be called at the top level, not inside loops, conditions, or nested functions.`,
          );
        }
      };

      lintMacros();
      lintHooks();
    },
  };
}
