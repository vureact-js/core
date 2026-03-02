import { ParseResult } from '@babel/parser';
import { TraverseOptions } from '@babel/traverse';
import * as t from '@babel/types';
import { ICompilationContext } from '@compiler/context/types';
import { atComponentOrHookRoot } from '@shared/babel-utils';
import { analyzeDeps } from '../../shared/dependency-analyzer';
import { createUseMemo } from '../../shared/hook-creator';
import { setScriptNodeMeta } from '../../shared/metadata-utils';

/**
 * 处理顶层表达式，根据值表达式内部是否有依赖，
 * 包装成 useMemo 调用
 */
export function resolveExprMemo(ctx: ICompilationContext, ast: ParseResult): TraverseOptions {
  const isScriptFile = ctx.inputType !== 'sfc';
  return {
    VariableDeclarator(path) {
      const { node } = path;
      const { init } = node;

      // 如果没有初始值，直接返回
      if (!init) return;

      const shouldMemo = (): boolean => {
        // 排除非有效顶层变量声明
        if (!atComponentOrHookRoot(path, ast.program, isScriptFile)) {
          return false;
        }

        // 排除值为 hook 调用
        if (
          t.isCallExpression(init) &&
          t.isIdentifier(init.callee) &&
          init.callee.name.startsWith('use')
        ) {
          return false;
        }

        return true;
      };

      if (!shouldMemo()) return;

      // 分析依赖，如果有，则将值包装在 useMemo 里调用并返回
      const initPath = path.get('init');
      if (!initPath.isExpression()) return;

      const deps = analyzeDeps(initPath.node, ctx, initPath);

      if (!deps.elements.length) return;

      // 创建 useMemo 调用
      const useMemoCall = createUseMemo(initPath.node, deps);

      // 替换节点的 init 为 useMemo 调用
      initPath.replaceWith(useMemoCall);

      // 标记该变量为间接响应式，供后续依赖分析溯源使用
      setScriptNodeMeta(node, { is_reactive: true, reactive_type: 'indirect' });
    },
  };
}
