import { NodePath } from '@babel/traverse';
import * as t from '@babel/types';
import { ICompilationContext } from '@compiler/context/types';
import { findRootIdentifier } from '../babel-utils';
import { isReactValidDependencyExpr } from './dep-checker';

/**
 * 规范化依赖表达式：
 * 1. 对于标识符，直接返回标识符节点
 * 2. 对于成员表达式，检查是否为有效的依赖表达式：
 *    - 如果是有效的静态成员链（如 state.count），则克隆整个表达式
 *    - 否则只返回根标识符（如对于动态属性访问 obj[prop]，只返回 obj）
 * 3. 其他类型表达式返回 null
 */
export function normalizeDependencyExpr(
  path: NodePath<t.Expression | t.Identifier>,
  rootName: string,
  ctx: ICompilationContext,
): t.Expression | null {
  // 处理标识符：直接返回标识符节点
  if (t.isIdentifier(path.node)) {
    return t.identifier(path.node.name);
  }

  // 处理成员表达式：
  // 1. 如果是有效的响应式依赖表达式（静态成员链），克隆整个表达式
  // 2. 否则只返回根标识符（例如动态属性访问只返回对象本身）
  if (t.isMemberExpression(path.node) || t.isOptionalMemberExpression(path.node)) {
    // props.xxx 依赖应尽量保留到属性级别，避免粗粒度回退到整个 props。
    // 仅当访问路径不可静态分析（如 props[key]）时，才回退到 props。
    if (rootName === ctx.propField) {
      const safePropsExp = ensureOptionalForMemberChain(path.node);

      if (isReactValidDependencyExpr(safePropsExp)) {
        return t.cloneNode(safePropsExp, true);
      }

      return t.identifier(rootName);
    }

    const normalizedExp = normalizeMemberForCallSite(path, path.node);

    // fix: 如果依赖链存在多级属性访问，则需要使用可选链保护，
    // 避免依赖数组在渲染阶段因中间节点为 null/undefined 直接崩溃。
    const safeExp =
      t.isMemberExpression(normalizedExp) || t.isOptionalMemberExpression(normalizedExp)
        ? ensureOptionalForMemberChain(normalizedExp)
        : normalizedExp;

    if (isReactValidDependencyExpr(safeExp)) {
      return t.cloneNode(safeExp, true);
    }

    return t.identifier(rootName);
  }

  return null;
}

/**
 * 规范化溯源得到的依赖表达式，保证与直接收集时的行为一致
 */
export function normalizeSourcedDependency(exp: t.Expression): t.Expression | null {
  // 情况1：标识符表达式（如变量名）
  if (t.isIdentifier(exp)) {
    // 直接创建同名标识符节点作为依赖
    return t.identifier(exp.name);
  }

  // 情况2：成员表达式或可选链表达式（如 obj.prop、obj?.prop）
  if (t.isMemberExpression(exp) || t.isOptionalMemberExpression(exp)) {
    // 获取表达式的根标识符（如 a.b.c 中的 a）
    const root = findRootIdentifier(exp);
    if (!root) return null;

    // 对 ref.value 链式访问添加可选链保护，避免渲染时因空值崩溃
    const safeExp =
      t.isMemberExpression(exp) || t.isOptionalMemberExpression(exp)
        ? ensureOptionalForMemberChain(exp)
        : exp;

    // 检查是否为有效的静态成员链依赖表达式
    if (isReactValidDependencyExpr(safeExp)) {
      // 克隆整个表达式作为依赖（如 state.count）
      return t.cloneNode(safeExp, true);
    }

    // 如果不是有效的静态成员链，则只返回根标识符作为依赖（如动态属性访问 obj[prop] 只返回 obj）
    return t.identifier(root.name);
  }

  // 其他类型表达式不支持作为依赖
  return null;
}

/**
 * 对成员调用场景做归一化：
 * 例如 obj.bar.toFixed() 的依赖应为 obj.bar，而不是 obj.bar.toFixed，
 * 否则可能出现依赖值稳定但结果变化的情况。
 */
export function normalizeMemberForCallSite(
  path: NodePath<t.Expression | t.Identifier>,
  node: t.MemberExpression | t.OptionalMemberExpression,
): t.Expression {
  const parent = path.parentPath;

  // 检查当前成员表达式是否直接作为调用表达式的 callee（例如 obj.foo() 中的 obj.foo）
  const isDirectCallee =
    !!parent &&
    ((parent.isCallExpression() && parent.node.callee === node) ||
      (parent.isOptionalCallExpression() && parent.node.callee === node));

  // 如果不是直接作为调用表达式的 callee，则返回原始节点（无需归一化）
  if (!isDirectCallee) {
    return node;
  }

  // 确保成员表达式的 object 部分是一个有效的表达式节点
  if (!t.isExpression(node.object)) {
    return node;
  }

  // 对于调用场景，返回 object 部分作为依赖（例如 obj.foo() 的依赖应为 obj，而不是 obj.foo）
  return node.object;
}

/**
 * 为多级成员链添加可选链保护：
 * 例如 a.b.c => a?.b?.c
 * 如果已经是可选链或只有一级，则直接返回
 */
export function ensureOptionalForMemberChain(
  node: t.MemberExpression | t.OptionalMemberExpression,
): t.MemberExpression | t.OptionalMemberExpression {
  if (!hasTrailingMemberAccess(node)) {
    return node;
  }

  // 已经是可选链则直接返回
  if (t.isOptionalMemberExpression(node) && node.optional) {
    return node;
  }

  const object = t.cloneNode(node.object as t.Expression, true);
  const property = t.cloneNode(node.property, true) as t.Expression | t.Identifier;
  return t.optionalMemberExpression(object, property, node.computed, true);
}

/**
 * 判断成员表达式是否有上级成员访问（即是否是嵌套链的一部分）
 */
export function hasTrailingMemberAccess(
  node: t.MemberExpression | t.OptionalMemberExpression,
): boolean {
  return t.isMemberExpression(node.object) || t.isOptionalMemberExpression(node.object);
}
