import { Binding, NodePath } from '@babel/traverse';
import * as t from '@babel/types';
import { getScriptNodeMeta } from '../metadata-utils';

/**
 * “局部绑定”判定从“同 scope”改为“是否声明在当前分析边界内”。
 */
export function isBindingDeclaredInsideBoundary(binding: Binding, boundary: t.Node): boolean {
  let current: NodePath<t.Node> | null = binding.path as NodePath<t.Node>;

  // 用当前绑定路径的上级父路径节点和边界节点做对比
  while (current) {
    if (current.node === boundary) {
      return true;
    }

    current = current.parentPath as NodePath<t.Node> | null;
  }

  return false;
}

/**
 * 判断节点是否被标记为响应式绑定
 */
export function isReactiveBinding(node?: t.Node): boolean {
  if (!node) return false;
  return !!getScriptNodeMeta(node)?.is_reactive;
}
