import * as t from '@babel/types';
import { JSXChild } from '../../types';

export function buildFragmentNode(nodeIR: JSXChild[]): t.JSXFragment {
  return t.jsxFragment(t.jsxOpeningFragment(), t.jsxClosingFragment(), nodeIR);
}

export function buildTextNode(nodeIR: string): t.JSXText {
  return t.jsxText(nodeIR);
}

export function buildJsxExpressionNode(nodeIR: t.Expression): t.JSXExpressionContainer {
  return t.jsxExpressionContainer(nodeIR);
}
