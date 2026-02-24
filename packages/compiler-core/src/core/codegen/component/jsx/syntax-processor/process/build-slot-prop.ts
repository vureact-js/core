import { parseExpression } from '@babel/parser';
import * as t from '@babel/types';
import { ICompilationContext } from '@compiler/context/types';
import { logger } from '@shared/logger';
import { TemplateChildNodeIR } from '@src/core/transform/sfc/template';
import { SlotPropsIR } from '@src/core/transform/sfc/template/syntax-processor/process';
import { JSXChild } from '../../types';
import { convertJsxChildToExpression } from '../../utils/jsx-expression-utils';
import { buildJsxChildren } from './build-jsx-children';
import { buildJsxNode } from './build-jsx-node';
import { buildFragmentNode, buildJsxExpressionNode } from './build-simple-node';

export function buildSlotProp(
  nodeIR: SlotPropsIR,
  ctx: ICompilationContext,
): t.JSXAttribute | t.JSXSpreadAttribute | t.ArrowFunctionExpression | JSXChild | null {
  const slotKey = t.jsxIdentifier(nodeIR.name);

  const childrenNodeIR: TemplateChildNodeIR[] | undefined = !nodeIR.isScoped
    ? nodeIR.content
    : nodeIR.callback?.exp;

  if (!childrenNodeIR?.length) {
    return null;
  }

  const jsxChild =
    childrenNodeIR.length > 1
      ? buildFragmentNode(buildJsxChildren(childrenNodeIR, ctx))
      : buildJsxNode(childrenNodeIR[0]!, ctx);

  if (!jsxChild) {
    return null;
  }

  const slotValue = nodeIR.isScoped
    ? t.arrowFunctionExpression(
        buildSlotCallbackParams(nodeIR, ctx),
        convertJsxChildToExpression(jsxChild),
      )
    : jsxChild;

  if (nodeIR.name === 'children') {
    return slotValue;
  }

  if (!nodeIR.isStatic) {
    const dynamicSlotKey = parseExpression(nodeIR.name) as t.Expression;
    const spreadObject = t.objectExpression([
      t.objectProperty(dynamicSlotKey, convertSlotValueToExpression(slotValue), true),
    ]);

    return t.jsxSpreadAttribute(spreadObject);
  }

  return t.jsxAttribute(slotKey, buildJsxExpressionNode(convertSlotValueToExpression(slotValue)));
}

function convertSlotValueToExpression(nodeIR: t.ArrowFunctionExpression | JSXChild): t.Expression {
  if (t.isArrowFunctionExpression(nodeIR)) {
    return nodeIR;
  }

  return convertJsxChildToExpression(nodeIR);
}

function buildSlotCallbackParams(
  nodeIR: SlotPropsIR,
  ctx: ICompilationContext,
): (t.Identifier | t.Pattern | t.RestElement)[] {
  const rawArg = nodeIR.callback?.arg?.trim();
  if (!rawArg) {
    return [];
  }

  const source = rawArg.startsWith('(') ? `${rawArg} => null` : `(${rawArg}) => null`;

  try {
    const expression = parseExpression(source);
    if (!t.isArrowFunctionExpression(expression)) {
      return [];
    }

    return expression.params as (t.Identifier | t.Pattern | t.RestElement)[];
  } catch {
    logger.warn(`Failed to parse slot params "${rawArg}". Falling back to no-arg slot function.`, {
      file: ctx.filename,
    });

    return [];
  }
}
