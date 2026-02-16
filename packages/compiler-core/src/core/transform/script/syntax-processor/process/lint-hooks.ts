import { ParseResult } from '@babel/parser';
import { TraverseOptions } from '@babel/traverse';
import * as t from '@babel/types';
import { ICompilationContext } from '@compiler/context/types';
import { atComponentOrHookRoot } from '@shared/babel-utils';
import { logger } from '@shared/logger';

/**
 * 预校验 Hook 的使用是否符合 React 规范。
 * 注意：当前对照的是 Vue 源码，因此日志输出的源码内容是旧的
 */
export function lintHooks(ctx: ICompilationContext, ast: ParseResult): TraverseOptions {
  return {
    CallExpression(path) {
      const { node } = path;

      if (!t.isIdentifier(node.callee)) return;
      if (!node.callee.name.startsWith('use')) return;

      if (!atComponentOrHookRoot(path, ast.program)) {
        logger.error('Hooks can only be called at the top level of a function.', {
          file: ctx.filename,
          source: ctx.scriptData.source,
          loc: node.loc,
        });
      }
    },
  };
}
