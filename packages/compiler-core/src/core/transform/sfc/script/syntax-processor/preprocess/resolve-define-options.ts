import { TraverseOptions } from '@babel/traverse';
import { ICompilationContext } from '@compiler/context/types';
import { MACRO_API_NAMES } from '@consts/other';
import { isCalleeNamed } from '../../shared/babel-utils';

/**
 * 处理 defineOptions
 */
export function resolveDefineOptions(ctx: ICompilationContext): TraverseOptions {
  return {
    CallExpression(path) {
      const { node } = path;

      if (!isCalleeNamed(node, MACRO_API_NAMES.options)) {
        return;
      }

      // parse 阶段的 resolveDeclaredOptions 处理并收集了部分元数据
      // 这里没其他事的话就暂用于移除 defineOptions 节点

      path.remove();
    },
  };
}
