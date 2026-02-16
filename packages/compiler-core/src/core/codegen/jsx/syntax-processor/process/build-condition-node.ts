import * as t from '@babel/types';
import { ICompilationContext } from '@compiler/context/types';
import { ElementNodeIR } from '@transform/template/syntax-processor/process';
import { JSXChild } from '../../types';
import { convertJsxChildToExpression } from '../../utils/jsx-expression-utils';
import { buildElementNode } from './build-element-node';
import { buildJsxExpressionNode } from './build-simple-node';

export function buildConditionNode(nodeIR: ElementNodeIR, ctx: ICompilationContext): JSXChild {
  const condition = nodeIR.meta.condition!;
  const nextNodeIR = condition.next;
  const mutableNodeIR = nodeIR as ElementNodeIR & { __processing?: boolean };

  const buildCurrentNode = () => buildElementNode(nodeIR, ctx)!;

  const setFlags = () => {
    condition.isHandled = true;
    nodeIR.conditionIsHandled = true;
    mutableNodeIR.__processing = true;
  };

  const clearFlags = () => {
    delete mutableNodeIR.__processing;
  };

  setFlags();

  if (condition.else) {
    const result = buildCurrentNode();
    clearFlags();
    return result;
  }

  const testExpression = condition.babelExp.ast;
  const trueBranchExpression = convertJsxChildToExpression(buildCurrentNode());
  const falseBranchExpression = nextNodeIR
    ? convertJsxChildToExpression(buildElementNode(nextNodeIR, ctx)!)
    : t.nullLiteral();

  const conditionalExpression = t.conditionalExpression(
    testExpression,
    trueBranchExpression,
    falseBranchExpression,
  );

  clearFlags();

  return buildJsxExpressionNode(conditionalExpression);
}
