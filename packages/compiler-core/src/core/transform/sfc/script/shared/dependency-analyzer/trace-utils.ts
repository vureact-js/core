import { Binding, NodePath } from '@babel/traverse';
import * as t from '@babel/types';
import { findRootIdentifier, getVariableDeclaratorPath } from '../babel-utils';
import { isEligibleBindingSource } from './dep-checker';

/**
 * 递归溯源：检查变量的初始值是否来源于响应式对象
 */
export function traceBindingSource(
  binding: Binding,
  seen: Set<t.Node>,
  depth: number,
): t.Expression | null {
  if (depth <= 0) return null;

  const declaratorPath = getVariableDeclaratorPath(binding.path);
  if (!declaratorPath || !declaratorPath.node.init) return null;

  // 防止循环引用
  if (seen.has(declaratorPath.node)) return null;
  seen.add(declaratorPath.node);

  const { init } = declaratorPath.node;

  // 检查初始值表达式（init）是否涉及响应式绑定
  return isExpressionSourcedFromEligibleBinding(init, declaratorPath.scope, seen, depth - 1);
}

/**
 * 判断一个表达式是否来源于合法的响应式绑定（可递归溯源）
 */
function isExpressionSourcedFromEligibleBinding(
  exp: t.Expression,
  scope: NodePath['scope'],
  seen: Set<t.Node>,
  depth: number,
): t.Expression | null {
  if (depth <= 0) return null;

  // Case 1: 标识符 (例如 c = state)
  if (t.isIdentifier(exp)) {
    const sourceBinding = scope.getBinding(exp.name);
    if (!sourceBinding) return null;

    // 如果源头已经是合格的，直接返回该表达式
    if (isEligibleBindingSource(sourceBinding)) {
      return exp;
    }
    // 否则继续向上递归
    return traceBindingSource(sourceBinding, seen, depth - 1);
  }

  // Case 2: 成员表达式 (例如 c = state.count)
  if (t.isMemberExpression(exp) || t.isOptionalMemberExpression(exp)) {
    const root = findRootIdentifier(exp);
    if (!root) return null;

    const sourceBinding = scope.getBinding(root.name);
    if (!sourceBinding) return null;

    if (isEligibleBindingSource(sourceBinding)) {
      // 【重点】这里返回完整的成员表达式 exp (state.count)
      // 而不仅仅是 root (state)
      // 需要 clone 一份，因为 AST 节点不能多处复用
      return t.cloneNode(exp);
    }

    // 如果 root 本身也是局部变量，继续溯源 root
    // 例如: const a = state; const b = a.count;
    const sourcedRoot = traceBindingSource(sourceBinding, seen, depth - 1);
    if (sourcedRoot) {
      const rebuilt = rebuildMemberWithNewRoot(exp, sourcedRoot);
      if (rebuilt) {
        return rebuilt;
      }

      return t.cloneNode(sourcedRoot, true);
    }
  }

  return null;
}

/**
 * 将成员表达式的根标识符替换为新根表达式：
 * a.b.c + state.foo => state.foo.b.c
 */
function rebuildMemberWithNewRoot(
  node: t.MemberExpression | t.OptionalMemberExpression,
  nextRoot: t.Expression,
): t.Expression | null {
  // 替换成员表达式的根对象部分：
  // 1. 如果当前节点的object是标识符，直接用新根节点替换
  // 2. 如果当前节点的object是成员表达式，递归替换其根对象
  const replacedObject = (() => {
    // 标识符情况：直接克隆新根节点作为替换对象
    if (t.isIdentifier(node.object)) {
      return t.cloneNode(nextRoot, true);
    }

    // 嵌套成员表达式情况：递归替换其根对象
    if (t.isMemberExpression(node.object) || t.isOptionalMemberExpression(node.object)) {
      return rebuildMemberWithNewRoot(node.object, nextRoot);
    }

    // 其他类型表达式不支持替换
    return null;
  })();

  // 如果替换对象失败，返回null
  if (!replacedObject) {
    return null;
  }

  // 克隆当前节点的属性部分（保持原属性不变）
  const property = t.cloneNode(node.property, true);

  // 根据节点类型重建成员表达式：
  // 1. 普通成员表达式：使用替换后的对象和原属性构建新节点
  // 2. 可选链表达式：额外保留optional标记
  if (t.isMemberExpression(node)) {
    return t.memberExpression(
      replacedObject,
      property as t.Expression | t.Identifier,
      node.computed,
    );
  }

  return t.optionalMemberExpression(
    replacedObject,
    property as t.Expression | t.Identifier,
    node.computed,
    node.optional,
  );
}
