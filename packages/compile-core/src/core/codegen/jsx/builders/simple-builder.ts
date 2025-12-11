import * as t from '@babel/types';
import { JSXChild } from '../types';

export function buildFragment(children: JSXChild[]): t.JSXFragment {
  return t.jsxFragment(t.jsxOpeningFragment(), t.jsxClosingFragment(), children);
}

export function buildText(value: string): t.JSXText {
  return t.jsxText(value);
}

export function buildJSXExpression(exp: t.Expression): t.JSXExpressionContainer {
  return t.jsxExpressionContainer(exp);
}
