import * as t from '@babel/types';
import { JSXChild } from '../types';

export function convertJsxChildToExpression(nodeIR: JSXChild): t.Expression {
  if (t.isJSXExpressionContainer(nodeIR)) {
    return nodeIR.expression as t.Expression;
  }

  if (t.isJSXText(nodeIR)) {
    return t.stringLiteral(nodeIR.value);
  }

  if (t.isJSXSpreadChild(nodeIR)) {
    return nodeIR.expression;
  }

  if (t.isJSXElement(nodeIR) || t.isJSXFragment(nodeIR)) {
    return nodeIR;
  }

  return t.nullLiteral();
}
