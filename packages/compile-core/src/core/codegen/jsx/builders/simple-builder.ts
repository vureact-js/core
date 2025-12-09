import { parseExpression } from '@babel/parser';
import * as t from '@babel/types';
import { getBabelParseOptions } from '@shared/babel-utils';
import { compileContext } from '@shared/compile-context';
import { JSXChild } from '../types';

export function buildFragment(children: JSXChild[]): t.JSXFragment {
  return t.jsxFragment(t.jsxOpeningFragment(), t.jsxClosingFragment(), children);
}

export function buildText(
  value: string,
  isComment?: boolean,
): t.JSXText | t.JSXExpressionContainer {
  return !isComment ? t.jsxText(value) : buildJSXExpression(`/*${value}*/`);
}

export function buildJSXExpression(value: string): t.JSXExpressionContainer {
  try {
    const { lang } = compileContext.context;
    const expression = parseExpression(value, getBabelParseOptions(lang.script));
    return t.jsxExpressionContainer(expression);
  } catch (e) {
    console.error(e);
    // 回退方案：作为直接作为标识符处理
    return t.jsxExpressionContainer(t.identifier(value));
  }
}
