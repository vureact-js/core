import * as t from '@babel/types';
import { warn } from '@utils/warn';

export function extractParamFromSlot(
  exp: t.Expression
): t.Identifier | t.Pattern {
  if (t.isIdentifier(exp)) {
    return exp;
  }

  // Support object destructuring, including nested { title, desc: [a, b] }
  if (t.isObjectExpression(exp)) {
    return t.objectPattern(
      exp.properties
        .map(prop => {
          if (t.isObjectProperty(prop) && t.isIdentifier(prop.key)) {
            const value = prop.value as t.Expression;
            // Recursively handle nested values
            return t.objectProperty(prop.key, extractParamFromSlot(value));
          }
          return null;
        })
        .filter(Boolean) as t.ObjectProperty[]
    );
  }

  // 支持数组解构，包括嵌套 / Support array destructuring, including nested
  if (t.isArrayExpression(exp)) {
    return t.arrayPattern(
      exp.elements
        .map(el => {
          if (t.isIdentifier(el)) return el;
          if (t.isNullLiteral(el)) return null;
          if (t.isExpression(el)) return extractParamFromSlot(el);
          warn('Unsupported array element in slot param');
          return t.identifier('unknow');
        })
        .filter(Boolean)
    );
  }

  warn('Unsupported slot param expression');
  return t.identifier('slotProps'); // Fallback
}
