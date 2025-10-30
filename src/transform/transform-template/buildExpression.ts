import * as t from '@babel/types';
import { REACT_HOOKS } from '@constants/react';
import { VUE_DIR } from '@constants/vue';
import { parseVForExpr } from '@parse/utils';
import { logger } from '@transform/utils/logger';
import { isNull, isUndefined } from '@utils/types';
import { NodeTypes, type DirectiveNode } from '@vue/compiler-core';
import { transformElementWithoutConditionals } from './transformElement';
import type { ExtendedDirectiveNode, ExtendedElementNode, ExtendedNode } from './types';

export function buildConditionalExpressionFromArray(
  nodes: ExtendedNode[],
  startIdx: number,
): { expr: t.Expression; consumed: number } {
  // 从 nodes[startIdx] 向后构建 v-if / else-if / else 嵌套表达式
  // Build v-if / else-if / else nested expressions backwards from nodes[startIdx]
  const startNode = nodes[startIdx] as ExtendedElementNode;

  const dir = startNode.props.find(
    (p) => p.type === NodeTypes.DIRECTIVE && [VUE_DIR.if, VUE_DIR.elseIf].includes(p.name),
  ) as ExtendedDirectiveNode | null;

  // 先构建基础 JSXElement（不含结构性指令） / First build the basic JSXElement
  const baseTrue = transformElementWithoutConditionals(startNode, startNode.props);

  // 统一实现把基础 JSX 按 v-for / v-once/v-memo / v-text 等包装，所有结构性指令的组合行为都在这里解决
  // Package basic JSX with v-for / v-once / v-memo / v-text to solve the combined behavior of all structural instructions
  const applyStructuralWrappers = (
    node: ExtendedElementNode,
    baseExpr: t.Expression,
  ): t.Expression => {
    // v-text 优先级高：如果存在 v-text，则直接返回对应表达式（作为 children 的替代）
    // Prioritize v-text
    const textExpr = buildTextExpression(node);
    if (!isNull(textExpr)) return textExpr;

    // v-once / v-memo -> useMemo wrapper: () => baseExpr
    const memoExpr = buildMemoExpression(node);
    if (!isNull(memoExpr)) return memoExpr;

    // v-for -> list.map(params => baseExpr)
    const forExpr = buildForExpression(node, baseExpr);
    if (!isNull(forExpr)) return forExpr;

    // 默认返回基础表达式 / By default, the base expression is returned.
    return baseExpr;
  };

  // 再用统一 wrapper 把基础元素包装成最终表达式（例如 map/useMemo 等）
  // Then use a unified wrapper to wrap the basic elements into the final expression (such as map/useMemo, etc.)
  const trueBranch = applyStructuralWrappers(startNode, baseTrue);

  let falseBranch: t.Expression = t.nullLiteral();
  let consumed = 1;

  // 向后查找 else-if / else，递归构建
  // Look backwards for else-if / else, building recursively
  let j = startIdx + 1;
  while (j < nodes.length) {
    const next = nodes[j] as any;
    if (isUndefined(next) || next.type !== NodeTypes.ELEMENT || next.vIfHandled) {
      break;
    }

    const nextDir = next.props.find(
      (p: DirectiveNode) =>
        p.type === NodeTypes.DIRECTIVE && [VUE_DIR.elseIf, VUE_DIR.else].includes(p.name),
    ) as ExtendedDirectiveNode | null;

    if (isNull(nextDir)) break;

    if (nextDir.name === VUE_DIR.elseIf) {
      if (isUndefined(nextDir.babelExp)) {
        logger.error(nextDir, 'v-else-if missing expression');
        break;
      }
      // 嵌套的 v-else-if 节点继续递归向后搜索
      // Nested branches continue recursively searching backwards
      const nested = buildConditionalExpressionFromArray(nodes, j);
      falseBranch = nested.expr;
      consumed += nested.consumed;
      break;
    } else if (nextDir.name === VUE_DIR.else) {
      // v-else returns the node directly
      const baseElse = transformElementWithoutConditionals(next, next.props);
      falseBranch = applyStructuralWrappers(next, baseElse);
      next.vIfHandled = true;
      consumed += 1;
      break;
    }
    break;
  }

  startNode.vIfHandled = true;

  if (isNull(dir) || isUndefined(dir.babelExp)) {
    return { expr: trueBranch, consumed };
  }

  return {
    expr: t.conditionalExpression(dir.babelExp, trueBranch, falseBranch),
    consumed,
  };
}

export function buildTextExpression(node: ExtendedElementNode): t.Expression | null {
  const textDir = node.props.find(
    (p) => p.type === NodeTypes.DIRECTIVE && p.name === VUE_DIR.text,
  ) as ExtendedDirectiveNode | undefined;
  if (!isUndefined(textDir) && !isUndefined(textDir.babelExp)) {
    return textDir.babelExp as t.Expression;
  }
  return null;
}

export function buildForExpression(
  node: ExtendedElementNode,
  body?: t.Expression,
): t.CallExpression | null {
  const forDir = node.props.find(
    (p) => p.type === NodeTypes.DIRECTIVE && p.name === VUE_DIR.for,
  ) as ExtendedDirectiveNode | undefined;

  if (forDir?.exp?.type !== NodeTypes.SIMPLE_EXPRESSION) return null;

  const parsed = parseVForExpr(forDir.exp.content);
  if (isNull(parsed)) {
    logger.error(forDir.exp, 'Invalid v-for expression');
    return null;
  }

  const paramIds = parsed.params.map((p) => t.identifier(p));
  // 如果 body 是 JSXElement，需要作为返回表达式
  // If body is a JSXElement, it should be used as the return expression.
  const mapCallback = t.arrowFunctionExpression(
    paramIds,
    body ?? transformElementWithoutConditionals(node, node.props),
  );
  // 构造 map 调用（listExpr 字符串转为 Identifier 或更复杂表达式处理简单化）
  // 尝试把 listExpr 解析为 Identifier，否则作为 Identifier(listExpr)
  // listExpr Converts a string to an Identifier or a more complex expression to simplify processing
  const listExprId = /^[A-Za-z_$][\w$]*$/.test(parsed.listExpr)
    ? t.identifier(parsed.listExpr)
    : t.identifier(parsed.listExpr); // 仍可工作但可能需更复杂解析 / More complex analysis may be required

  return t.callExpression(t.memberExpression(listExprId, t.identifier('map')), [mapCallback]);
}

export function buildMemoExpression(node: ExtendedElementNode): t.CallExpression | null {
  const memoDir = node.props.find(
    (p) => p.type === NodeTypes.DIRECTIVE && (p.name === VUE_DIR.once || p.name === VUE_DIR.memo),
  ) as ExtendedDirectiveNode | undefined;

  if (isUndefined(memoDir)) return null;

  const body = transformElementWithoutConditionals(node, node.props);

  let deps: t.ArrayExpression;
  if (isUndefined(memoDir.babelExp)) {
    deps = t.arrayExpression([]);
  } else if (t.isArrayExpression(memoDir.babelExp)) {
    deps = memoDir.babelExp as t.ArrayExpression;
  } else {
    deps = t.arrayExpression([memoDir.babelExp as t.Expression]);
  }

  return t.callExpression(t.identifier(REACT_HOOKS.useMemo), [
    t.arrowFunctionExpression([], body),
    deps,
  ]);
}
