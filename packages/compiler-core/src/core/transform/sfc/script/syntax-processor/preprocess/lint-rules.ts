import { ParseResult } from '@babel/parser';
import { TraverseOptions } from '@babel/traverse';
import * as t from '@babel/types';
import { ICompilationContext } from '@compiler/context/types';
import { ADAPTER_HOOKS } from '@consts/adapters-map';
import { COMP_PROPS_NAME, EMITS_API_VAR_NAME, SLOTS_API_VAR_NAME } from '@consts/other';
import { atComponentOrHookRoot } from '@shared/babel-utils';
import { logger } from '@shared/logger';

/**
 * 预校验即将转换成 React hook 的 Vue3 API 的使用是否符合 React 规范，
 * 以及宏定义和其他的一些 vureact 规范
 */
export function lintRules(ctx: ICompilationContext, ast: ParseResult): TraverseOptions {
  const inScriptFile = ctx.inputType !== 'sfc';

  const macroVarNames: Record<string, string> = {
    defineProps: COMP_PROPS_NAME,
    defineEmits: EMITS_API_VAR_NAME,
    defineSlots: SLOTS_API_VAR_NAME,
  };

  return {
    CallExpression(path) {
      const { node, parentPath } = path;

      if (!t.isIdentifier(node.callee)) return;

      const { name } = node.callee;
      const macroVarName = macroVarNames[name];

      const lintMacros = () => {
        if (!name.startsWith('define')) return;
        if (inScriptFile) {
          addLog('Macro definition outside Vue SFC is not supported.');
          return;
        }
        if (!atComponentOrHookRoot(path, ast.program)) {
          addLog('Macro definition cannot be nested inside blocks or functions.');
          return;
        }
        if (parentPath.isVariableDeclarator() && t.isIdentifier(parentPath.node.id)) {
          const { id } = parentPath.node;
          if (id.name !== macroVarName) {
            addLog(`${name} must be assigned to a variable named ${macroVarName}`);
          }
        } else {
          addLog(`${name} used without assignment to ${macroVarName} variable`);
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
