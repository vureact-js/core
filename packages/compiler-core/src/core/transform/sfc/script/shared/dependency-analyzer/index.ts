import { traverse } from '@babel/core';
import { NodePath } from '@babel/traverse';
import * as t from '@babel/types';
import { ICompilationContext } from '@compiler/context/types';
import { findRootIdentifier, isRealVariableAccess } from '../babel-utils';
import { isBindingDeclaredInsideBoundary } from './binding-utils';
import { isEligibleBindingSource } from './dep-checker';
import { getDependencyKey } from './dep-key';
import { normalizeDependencyExpr, normalizeSourcedDependency } from './dep-normalizer';
import { TRACE_MAX_DEPTH, isNestedMemberObject } from './shared-utils';
import { traceBindingSource } from './trace-utils';

/**
 * 分析表达式或语句块中的响应式依赖
 * @param node 要分析的 AST 节点
 * @param parentPath 当前节点的路径，用于确定作用域边界
 */
export function analyzeDeps(
  node: t.Node,
  ctx: ICompilationContext,
  parentPath?: NodePath,
): t.ArrayExpression {
  if (!parentPath) {
    return t.arrayExpression([]);
  }

  const isFnExpr = t.isArrowFunctionExpression(node) || t.isFunctionExpression(node);

  // 确定分析目标：函数表达式则分析其函数体，否则分析节点本身
  const analyzeTarget = isFnExpr ? node.body : node;

  // 确定局部绑定边界：函数表达式则以函数节点为边界，否则以分析目标为边界
  const bindingLocalBoundary = isFnExpr ? node : analyzeTarget;

  // 使用 Map 存储依赖，Key 为依赖表达式的字符串表示（去重），Value 为 AST 节点
  const deps = new Map<string, t.Expression>();

  // 记录已处理的标识符，避免重复处理（例如 a.b.c 已经处理了 a，就不再单独处理 a）
  const processedIdentifiers = new WeakSet<t.Identifier>();

  function addDependency(exp: t.Expression) {
    deps.set(getDependencyKey(exp), exp);
  }

  // 处理根节点为表达式的场景，避免只收集到对象标识符
  const analyzeTargetPath =
    parentPath && (parentPath.node as t.Node) === analyzeTarget
      ? (parentPath as NodePath<t.Expression | t.Identifier>)
      : null;

  if (analyzeTargetPath) {
    // 处理分析目标本身就是表达式的情况（如直接传入一个成员表达式或标识符）
    if (t.isMemberExpression(analyzeTarget) || t.isOptionalMemberExpression(analyzeTarget)) {
      // 获取成员表达式的根标识符（如 a.b.c 中的 a）
      const rootId = findRootIdentifier(analyzeTarget);
      if (rootId) {
        // 尝试将该成员表达式添加为依赖
        tryAddDependency(analyzeTargetPath, rootId.name, analyzeTargetPath.scope);
        // 标记根标识符已处理，防止后续遍历时重复处理
        processedIdentifiers.add(rootId);
      }
    } else if (t.isIdentifier(analyzeTarget)) {
      // 处理分析目标本身就是标识符的情况
      tryAddDependency(analyzeTargetPath, analyzeTarget.name, analyzeTargetPath.scope);
    }
  }

  // 对分析目标进行遍历
  traverse(
    analyzeTarget,
    {
      'MemberExpression|OptionalMemberExpression'(memberPath) {
        const path = memberPath as NodePath<t.MemberExpression | t.OptionalMemberExpression>;

        // 如果是嵌套成员表达式的对象部分（如 a.b.c 中的 a.b），则跳过，避免重复处理
        if (isNestedMemberObject(path)) return;

        // 获取成员表达式的根标识符（如 a.b.c 中的 a）
        const rootId = findRootIdentifier(path.node);
        if (!rootId) return;

        // 尝试将该成员表达式添加为依赖
        tryAddDependency(path, rootId.name, path.scope);
        // 标记该根标识符已处理，防止后续 Identifier 访问器重复处理
        processedIdentifiers.add(rootId);
      },

      Identifier(idPath) {
        // 跳过已处理的标识符或非真实变量访问
        if (processedIdentifiers.has(idPath.node) || !isRealVariableAccess(idPath)) {
          return;
        }

        tryAddDependency(idPath, idPath.node.name, idPath.scope);
      },
    },
    // 确定作用域范围
    parentPath.scope,
  );

  // 尝试将一个标识符或成员表达式加入依赖列表
  function tryAddDependency(
    depPath: NodePath<t.Expression | t.Identifier>,
    rootName: string,
    scope: NodePath['scope'],
  ) {
    // 格式化依赖表达式（例如将 ref 变量转为 ref.value）
    const normalized = normalizeDependencyExpr(depPath, rootName, ctx);
    if (!normalized) return;

    // fix：https://github.com/vureact-js/core/issues/25
    // 检查是否是 props 相关的表达式（例如 props.a, props.b()）
    if (rootName === ctx.propField) {
      // defineProps 在预处理阶段会被移除，导致 props 在 AST 中可能没有显式 binding。
      // 这里将其视为编译器注入的隐式外部依赖；若存在同名局部 binding，则仍按局部优先处理。
      const propsBinding = scope.getBinding(rootName);
      const isLocalPropsBinding =
        !!propsBinding && isBindingDeclaredInsideBoundary(propsBinding, bindingLocalBoundary);

      if (!isLocalPropsBinding) {
        addDependency(normalized);
      }

      return;
    }

    // 查找该变量的定义（Binding）
    const binding = scope.getBinding(rootName);
    if (!binding) return;

    const isLocalBinding = isBindingDeclaredInsideBoundary(binding, bindingLocalBoundary);

    //  判断该绑定是否是“合法的依赖源”（来自导入、响应式 API 声明等）
    const directEligible = !isLocalBinding && isEligibleBindingSource(binding);

    if (directEligible) {
      addDependency(normalized);
      return;
    }

    // 如果不直接合格（通常是局部变量），尝试溯源
    const sourcedExpression = traceBindingSource(binding, new Set(), TRACE_MAX_DEPTH);

    if (sourcedExpression) {
      // 如果溯源成功，添加溯源到的原始表达式（例如 'state.value'）
      // 而不是当前的局部变量 'count'
      const normalizedSource = normalizeSourcedDependency(sourcedExpression);
      if (normalizedSource) {
        addDependency(normalizedSource);
      }
    }
  }

  // 将收集到的依赖转换为数组表达式并返回
  return t.arrayExpression(Array.from(deps.values()));
}
