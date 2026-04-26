import { NodePath } from '@babel/traverse';
import * as t from '@babel/types';

/**
 * 溯源最大深度，防止循环引用导致死循环
 */
export const TRACE_MAX_DEPTH = 20;

/**
 * 判断当前成员表达式是否作为另一个成员表达式的 object 部分（即嵌套成员表达式的内层）
 */
export function isNestedMemberObject(
  path: NodePath<t.MemberExpression | t.OptionalMemberExpression>,
): boolean {
  const parent = path.parentPath;
  if (!parent) return false;

  if (parent.isMemberExpression() || parent.isOptionalMemberExpression()) {
    return parent.node.object === path.node;
  }

  return false;
}
