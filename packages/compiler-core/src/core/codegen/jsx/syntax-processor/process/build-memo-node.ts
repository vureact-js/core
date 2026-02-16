import * as t from '@babel/types';
import { ICompilationContext } from '@compiler/context/types';
import { ElementNodeIR } from '@transform/template/syntax-processor/process';
import { JSXChild } from '../../types';
import { convertJsxChildToExpression } from '../../utils/jsx-expression-utils';
import { buildElementNode } from './build-element-node';
import { buildJsxExpressionNode } from './build-simple-node';

export function buildMemoNode(nodeIR: ElementNodeIR, ctx: ICompilationContext): JSXChild {
  const memo = nodeIR.meta.memo!;

  memo.isHandled = true;

  const depsExpression = memo.babelExp.ast;
  const bodyExpression = convertJsxChildToExpression(buildElementNode(nodeIR, ctx)!);

  const useMemoCallExpression = t.callExpression(t.identifier('useMemo'), [
    t.arrowFunctionExpression([], bodyExpression),
    depsExpression,
  ]);

  return buildJsxExpressionNode(useMemoCallExpression);
}
