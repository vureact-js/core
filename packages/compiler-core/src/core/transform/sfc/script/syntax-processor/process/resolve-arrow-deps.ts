import { ParseResult } from '@babel/parser';
import { NodePath, TraverseOptions } from '@babel/traverse';
import * as t from '@babel/types';
import { ICompilationContext } from '@compiler/context/types';
import { PACKAGE_NAME } from '@consts/other';
import { REACT_API_MAP } from '@consts/react-api-map';
import { atComponentOrHookRoot } from '@shared/babel-utils';
import { recordImport } from '@transform/shared';
import { getVariableDeclaratorPath } from '../../shared/babel-utils';
import { analyzeDeps, getIsAnalyzed, markAsAnalyzed } from '../../shared/dependency-analyzer';
import { createUseCallback } from '../../shared/hook-creator';
import { setScriptNodeMeta } from '../../shared/metadata-utils';

/**
 * 解决将箭头函数（非回调函数），
 * 根据其内部是否存在可用依赖项，
 * 提取并优化成 useCallback
 */
export function resolveArrowFnDeps(ctx: ICompilationContext, ast: ParseResult): TraverseOptions {
  return {
    ArrowFunctionExpression(path) {
      const { node, parentPath } = path;

      if (isSkip(path) || !atComponentOrHookRoot(parentPath, ast.program)) {
        return;
      }

      const deps = analyzeDeps(node.body, ctx, path);
      if (!deps.elements.length) return;

      const newNode = createUseCallback(node, deps);
      const declaratorPath = getVariableDeclaratorPath(path);

      // 标记新节点的箭头函数表达式为已分析
      markAsAnalyzed(newNode.arguments[0]!);
      recordImport(ctx, PACKAGE_NAME.react, REACT_API_MAP.useCallback);
      setScriptNodeMeta(declaratorPath?.node, { is_reactive: true, reactive_type: 'indirect' });

      // 替换成 useCallback
      path.replaceWith(newNode);
    },
  };
}

/**
 * 解决被作为依赖项收集的箭头函数，
 * 但自身并没有依赖可分析导致跳过，
 * 因此需要追加为 useCallback
 */
export function resolveUnanalyzedArrow(ctx: ICompilationContext): TraverseOptions {
  return {
    ArrowFunctionExpression(path) {
      const { node } = path;

      const analyzed = getIsAnalyzed(node);
      if (typeof analyzed === 'undefined' || analyzed) return;

      const newNode = createUseCallback(node);
      const declaratorPath = getVariableDeclaratorPath(path);

      if (declaratorPath?.node) {
        setScriptNodeMeta(declaratorPath.node, { is_reactive: true, reactive_type: 'indirect' });
      }

      // 标记新节点的箭头函数表达式为已分析
      markAsAnalyzed(newNode.arguments[0]!);

      // 替换成 useCallback
      path.replaceWith(newNode);
    },
  };
}

// 排除回调/方法/非箭头函数声明式
function isSkip(path: NodePath<t.ArrowFunctionExpression>): boolean {
  const { parentPath } = path;

  const isVariableDecl = () => getVariableDeclaratorPath(path) !== null;
  const isReturnFunc = () => !isVariableDecl() && parentPath.isReturnStatement();

  const isCallback = (): boolean => {
    if (!parentPath) {
      return false;
    }

    // 如果父节点是调用表达式，并且这个函数是参数之一，那么它是回调
    if (parentPath.isCallExpression()) {
      const callExpressionPath = parentPath as NodePath<t.CallExpression>;
      const args = callExpressionPath.node.arguments;

      // 检查这个函数节点是否是调用表达式的参数
      return args.some((arg) => arg === path.node);
    }

    // 如果父节点是数组表达式，可能也是回调
    if (parentPath.isArrayExpression()) {
      const arrayExpressionPath = parentPath as NodePath<t.ArrayExpression>;
      const elements = arrayExpressionPath.node.elements;

      // 检查这个函数节点是否是数组的元素
      return elements.some((element) => element === path.node);
    }

    return false;
  };

  const isMethod = (): boolean => {
    let current: NodePath<t.Node> | null = parentPath;

    while (current) {
      if (
        current.isClass() ||
        current.isObjectExpression() ||
        current.isArrayExpression() ||
        current.isObjectProperty() ||
        current.isMethod() ||
        current.isClassMethod() ||
        current.isObjectMethod()
      ) {
        return true;
      }

      // 找到天上去了，说明不是
      if (current.isProgram()) {
        return false;
      }

      current = current.parentPath;
    }

    return false;
  };

  return (isCallback() || isMethod() || !isVariableDecl()) && !isReturnFunc();
}
