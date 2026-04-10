import { traverse } from '@babel/core';
import { ICompilationContext } from '@compiler/context/types';
import { atComponentOrHookRoot } from '@shared/babel-utils';
import { ParseResult } from '../../';
import { resolveDeclaredOptions } from './resolve-declared-options';
import { resolveDeclaredPropsAndEmits } from './resolve-declared-props-emits';
import { resolveVarBindings } from './resolve-var-bindings';

/**
 * 预分析模板中的 script，进行元数据收集，供模板转换时使用。
 */
export function resolveScriptMeta(result: ParseResult, ctx: ICompilationContext) {
  const scriptAst = result.script?.ast;

  if (ctx.inputType !== 'sfc' || !scriptAst) {
    return;
  }

  traverse(scriptAst, {
    VariableDeclarator(path) {
      // 跳过非顶层声明变量
      if (!atComponentOrHookRoot(path, scriptAst.program)) {
        return;
      }

      resolveVarBindings(path.node, ctx);
    },

    CallExpression(path) {
      resolveDeclaredOptions(path, ctx);
      resolveDeclaredPropsAndEmits(path, ctx);
    },
  });
}
