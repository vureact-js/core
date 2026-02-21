import { traverse } from '@babel/core';
import { Binding, NodePath } from '@babel/traverse';
import * as t from '@babel/types';
import { ICompilationContext } from '@compiler/context/types';
import { getReactiveStateApis } from '@shared/reactive-utils';
import { findRootIdentifier, getVariableDeclaratorPath, isRealVariableAccess } from './babel-utils';
import { getScriptNodeMeta, setScriptNodeMeta } from './metadata-utils';

// 溯源最大深度，防止循环引用导致死循环
const TRACE_MAX_DEPTH = 20;

/**
 * 分析表达式或语句块中的响应式依赖
 * @param node 要分析的 AST 节点
 * @param parentPath 当前节点的路径，用于确定作用域边界
 */
export function analyzeDeps(
  node: t.ArrowFunctionExpression | t.FunctionExpression | t.Identifier,
  ctx: ICompilationContext,
  parentPath?: NodePath,
): t.ArrayExpression {
  if (!parentPath) {
    return t.arrayExpression([]);
  }

  // 如果不是有效的函数表达式，不分析依赖
  if (!t.isArrowFunctionExpression(node) && !t.isFunctionExpression(node)) {
    const deps: t.Expression[] = [];
    // 标识符直接作为依赖
    if (t.isIdentifier(node)) {
      deps.push(node);
    }

    return t.arrayExpression(deps);
  }

  const reactiveStateApis = getReactiveStateApis();

  // 使用 Map 存储依赖，Key 为依赖表达式的字符串表示（去重），Value 为 AST 节点
  const deps = new Map<string, t.Expression>();

  // 记录已处理的标识符，避免重复处理（例如 a.b.c 已经处理了 a，就不再单独处理 a）
  const processedIdentifiers = new WeakSet<t.Identifier>();

  function addDependency(exp: t.Expression) {
    deps.set(getDependencyKey(exp), exp);
  }

  traverse(
    node.body,
    {
      'MemberExpression|OptionalMemberExpression'(memberPath) {
        const path = memberPath as NodePath<t.MemberExpression | t.OptionalMemberExpression>;

        if (isNestedMemberObject(path)) return;

        const rootId = findRootIdentifier(path.node);
        if (!rootId) return;

        tryAddDependency(path, rootId.name, path.scope);
        processedIdentifiers.add(rootId);
      },

      Identifier(idPath) {
        if (processedIdentifiers.has(idPath.node) || !isRealVariableAccess(idPath)) {
          return;
        }

        tryAddDependency(idPath, idPath.node.name, idPath.scope);
      },
    },
    parentPath.scope,
  );

  // 尝试将一个标识符或成员表达式加入依赖列表
  function tryAddDependency(
    depPath: NodePath<t.Expression | t.Identifier>,
    rootName: string,
    scope: NodePath['scope'],
  ) {
    // 格式化依赖表达式（例如将 ref 变量转为 ref.value）
    const normalized = normalizeDependencyExpr(depPath, rootName);
    if (!normalized) return;

    // 查找该变量的定义（Binding）
    const binding = scope.getBinding(rootName);
    if (!binding) return;

    // 如果变量定义在当前分析的作用域内（局部变量），直接忽略
    if (binding.scope === parentPath?.scope) {
      return;
    }

    // 检查是否是 props 相关的表达式（例如 props.a, props.b()）
    if (rootName === ctx.propField) {
      // 如果是 props 相关的表达式，直接添加整个表达式作为依赖
      addDependency(normalized);
      return;
    }

    //  判断该绑定是否是“合法的依赖源”（来自导入、响应式 API 声明等）
    const directEligible = isEligibleBindingSource(binding, false);

    if (directEligible) {
      addDependency(normalized);
      return;
    }

    // 如果不直接合格（通常是局部变量），尝试溯源
    const sourcedExpression = traceBindingSource(binding, new Set(), TRACE_MAX_DEPTH);

    if (sourcedExpression) {
      // 如果溯源成功，添加溯源到的原始表达式（例如 'state.value'）
      // 而不是当前的局部变量 'count'
      addDependency(sourcedExpression);
    }
  }

  function normalizeDependencyExpr(
    path: NodePath<t.Expression | t.Identifier>,
    rootName: string,
  ): t.Expression | null {
    if (t.isIdentifier(path.node)) {
      return t.identifier(path.node.name);
    }

    if (t.isMemberExpression(path.node) || t.isOptionalMemberExpression(path.node)) {
      if (isReactValidDependencyExpr(path.node)) {
        return t.cloneNode(path.node, true);
      }

      return t.identifier(rootName);
    }

    return null;
  }

  function isReactValidDependencyExpr(node: t.Expression): boolean {
    if (t.isIdentifier(node)) {
      return true;
    }

    if (t.isMemberExpression(node) || t.isOptionalMemberExpression(node)) {
      return isStaticMemberChain(node);
    }

    return false;
  }

  function isStaticMemberChain(node: t.MemberExpression | t.OptionalMemberExpression): boolean {
    let current: t.Expression | t.Super = node;

    while (t.isMemberExpression(current) || t.isOptionalMemberExpression(current)) {
      if (!current.computed && !t.isIdentifier(current.property)) {
        return false;
      }

      if (
        current.computed &&
        !t.isStringLiteral(current.property) &&
        !t.isNumericLiteral(current.property)
      ) {
        return false;
      }

      current = current.object;
    }

    return t.isIdentifier(current);
  }

  /**
   * 判断绑定是否合格：
   * 1. 是否是 import 进来的
   * 2. 是否是 reactive/ref 等 API 声明的
   * 3. 是否是函数声明
   */
  function isEligibleBindingSource(binding: Binding, allowSameScope: boolean): boolean {
    if (binding.kind === 'param') {
      return false;
    }

    if (!allowSameScope && binding.scope === parentPath?.scope) {
      return false;
    }

    const bindingPath = binding.path;
    const declaratorPath = getVariableDeclaratorPath(bindingPath);

    const isImportBinding =
      bindingPath.isImportSpecifier() ||
      bindingPath.isImportDefaultSpecifier() ||
      bindingPath.isImportNamespaceSpecifier();

    const isReactiveVarBinding = !!declaratorPath && isReactiveBinding(declaratorPath.node);
    const nodeInit = declaratorPath?.node.init;

    const isReactiveApiCallVarBinding =
      !!declaratorPath &&
      t.isCallExpression(nodeInit) &&
      t.isIdentifier(nodeInit.callee) &&
      reactiveStateApis.has(nodeInit.callee.name);

    const isFunctionBinding = !!declaratorPath && t.isArrowFunctionExpression(nodeInit);

    if (isFunctionBinding) {
      // 如果是函数被收集为依赖，则尝试将对方标记为 “未分析依赖”
      markAsAnalyzed(nodeInit, false);
    }

    return (
      isImportBinding || isReactiveVarBinding || isReactiveApiCallVarBinding || isFunctionBinding
    );
  }

  // 递归溯源：检查变量的初始值是否来源于响应式对象
  function traceBindingSource(
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

      // 如果源头已经是合格的（例如 import 的 state），直接返回该表达式
      if (isEligibleBindingSource(sourceBinding, true)) {
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

      if (isEligibleBindingSource(sourceBinding, true)) {
        // 【重点】这里返回完整的成员表达式 exp (state.count)
        // 而不仅仅是 root (state)
        // 需要 clone 一份，因为 AST 节点不能多处复用
        return t.cloneNode(exp);
      }

      // 如果 root 本身也是局部变量，继续溯源 root
      // 例如: const a = state; const b = a.count;
      const sourcedRoot = traceBindingSource(sourceBinding, seen, depth - 1);
      if (sourcedRoot) {
        // 构造新的表达式: sourcedRoot + .count
        // 这一步比较复杂，简化处理可以只支持直接引用，或者暂不支持深层重构
        // 为了安全起见，如果通过 MemberExpression 溯源成功，
        // 我们往往认为整个表达式就是源。
        return t.cloneNode(exp);
      }
    }

    return null;
  }

  return t.arrayExpression(Array.from(deps.values()));
}

function getDependencyKey(exp: t.Expression): string {
  if (t.isIdentifier(exp)) {
    return exp.name;
  }

  if (t.isMemberExpression(exp) || t.isOptionalMemberExpression(exp)) {
    const objectKey = getDependencyKey(exp.object as t.Expression);
    const opt = exp.optional ? '?' : '';

    if (!exp.computed && t.isIdentifier(exp.property)) {
      return `${objectKey}${opt}.${exp.property.name}`;
    }

    if (t.isStringLiteral(exp.property) || t.isNumericLiteral(exp.property)) {
      return `${objectKey}${opt}[${JSON.stringify(exp.property.value)}]`;
    }

    return `${objectKey}${opt}[*]`;
  }

  return exp.type;
}

function isNestedMemberObject(
  path: NodePath<t.MemberExpression | t.OptionalMemberExpression>,
): boolean {
  const parent = path.parentPath;
  if (!parent) return false;

  if (parent.isMemberExpression() || parent.isOptionalMemberExpression()) {
    return parent.node.object === path.node;
  }

  return false;
}

export function isReactiveBinding(node?: t.Node): boolean {
  if (!node) return false;
  return !!getScriptNodeMeta(node)?.is_reactive;
}

export function markAsAnalyzed(node: t.Node, flag = true) {
  const analyzed = getIsAnalyzed(node);
  if (analyzed) return;
  setScriptNodeMeta(node, { is_deps_analyzed: flag });
}

export function getIsAnalyzed(node: t.Node): boolean | undefined {
  return getScriptNodeMeta(node)?.is_deps_analyzed;
}
