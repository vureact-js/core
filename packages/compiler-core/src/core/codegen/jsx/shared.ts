import * as t from '@babel/types';
import { JSXChild, JSXProp } from './types';

/**
 * convert JSX child to expression.
 */
export function convertToExpression(jsxChild: JSXChild): t.Expression {
  if (!jsxChild) {
    return t.nullLiteral();
  }

  if (t.isJSXExpressionContainer(jsxChild)) {
    return jsxChild.expression as t.Expression;
  }

  if (t.isJSXText(jsxChild)) {
    return t.stringLiteral(jsxChild.value);
  }

  // JSXElement、JSXFragment 等可以保留原样，因为它们本质上是 Expression
  // 但需要确保它们能在 JSX 表达式中使用
  if (t.isJSXElement(jsxChild) || t.isJSXFragment(jsxChild) || t.isJSXEmptyExpression(jsxChild)) {
    return jsxChild;
  }

  // 如果是其他 JSX 节点，需要转换为合适的表达式
  // 这里可以根据需要添加更多转换逻辑
  return jsxChild.expression;
}

export function createElement(
  tag: string,
  props: JSXProp[],
  children: JSXChild[],
  selfClosing?: boolean,
): t.JSXElement {
  const jsxTag = t.jsxIdentifier(tag);
  const isSelfClosing = selfClosing ?? !children.length;
  return t.jsxElement(
    t.jsxOpeningElement(jsxTag, props, isSelfClosing),
    t.jsxClosingElement(jsxTag),
    children,
  );
}
