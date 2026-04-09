import { traverse } from '@babel/core';
import { ICompilationContext } from '@compiler/context/types';
import { atComponentOrHookRoot } from '@shared/babel-utils';
import { ParseResult } from '../../';
import { resolveVarBindings } from './resolve-var-bindings';

/**
 * 使用 Babel 预分析 script，只做简单的元数据收集，供模板转换时使用。
 */
export function resolveScriptMeta(result: ParseResult, ctx: ICompilationContext) {
  const scriptAst = result.script?.ast;

  if (!scriptAst) return;

  traverse(scriptAst, {
    VariableDeclarator(path) {
      // 跳过非顶层声明变量
      if (!atComponentOrHookRoot(path, scriptAst.program)) {
        return;
      }

      resolveVarBindings(path.node, ctx);
    },
  });
}
