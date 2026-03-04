import * as t from '@babel/types';
import { JSXChild } from '../../types';

export function buildFragmentNode(nodeIR: JSXChild[]): t.JSXFragment {
  return t.jsxFragment(t.jsxOpeningFragment(), t.jsxClosingFragment(), nodeIR);
}

export function buildJsxExpressionNode(nodeIR: t.Expression): t.JSXExpressionContainer {
  return t.jsxExpressionContainer(nodeIR);
}

export function buildTextNode(nodeIR: string): t.JSXText | t.JSXExpressionContainer {
  // 如果文本包含 { 或 }，将其包装在JSX表达式中
  // 注意：在JSX表达式中，字符串字面量不需要转义HTML实体
  if (/[{}]/.test(nodeIR)) {
    return t.jsxExpressionContainer(t.stringLiteral(nodeIR));
  }

  // 对于纯文本，转义HTML实体
  const escapedText = escapeHTML(nodeIR);
  return t.jsxText(escapedText);
}

/**
 * 转义HTML特殊字符
 * 在JSX文本中，需要转义：
 * - & -> &amp;
 * - < -> &lt;
 * - > -> &gt;
 */
function escapeHTML(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
