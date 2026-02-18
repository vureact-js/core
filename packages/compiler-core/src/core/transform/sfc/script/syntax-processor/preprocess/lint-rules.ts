import { ParseResult } from '@babel/parser';
import { TraverseOptions } from '@babel/traverse';
import * as t from '@babel/types';
import { ICompilationContext } from '@compiler/context/types';
import { ADAPTER_HOOKS } from '@consts/adapters-map';
import { MACRO_API_NAMES } from '@consts/other';
import { atComponentOrHookRoot } from '@shared/babel-utils';
import { logger } from '@shared/logger';

/**
 * 预校验即将转换成 React hook 的 Vue3 API 的使用是否符合 React 规范，
 * 以及宏定义和其他的一些 vureact 规范
 */
export function lintRules(ctx: ICompilationContext, ast: ParseResult): TraverseOptions {
  const inScriptFile = ctx.inputType !== 'sfc';

  return {
    CallExpression(path) {
      const { node, parentPath } = path;

      if (!t.isIdentifier(node.callee)) return;

      const { name } = node.callee;

      const lintMacros = () => {
        const target = Object.values(MACRO_API_NAMES).find((v) => v === name);
        if (!target) return;

        if (inScriptFile) {
          addLog('Macro definition outside Vue SFC is not supported.');
          return;
        }
        if (!atComponentOrHookRoot(path, ast.program)) {
          addLog('Macro definition cannot be nested inside blocks or functions.');
          return;
        }
        if (!parentPath.isVariableDeclarator()) {
          addLog(`Missing variable for ${target} assignment`);
        }
      };

      const lintHooks = () => {
        if (!(name in ADAPTER_HOOKS.simple) && !(name in ADAPTER_HOOKS.complex)) {
          return;
        }
        if (!atComponentOrHookRoot(path, ast.program, inScriptFile)) {
          addLog(
            `The ${name} API can only be used in components, top-level functions, and non-nested child scopes.`,
          );
        }
      };

      const addLog = (t: string) => {
        logger.error(t, {
          file: ctx.filename,
          source: ctx.scriptData.source,
          loc: node.loc,
        });
      };

      lintMacros();
      lintHooks();
    },
  };
}
