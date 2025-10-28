import * as t from '@babel/types';

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function createSetterName(name: string, prefix = 'set'): string {
  return `${prefix}${capitalize(name)}`;
}

export function isSimpleExpression(expr: any): boolean {
  return (
    t.isLiteral(expr) || // 字面量：字符串、数字、布尔值等
    t.isIdentifier(expr) || // 变量引用
    t.isMemberExpression(expr) || // 对象属性访问
    (t.isUnaryExpression(expr) && t.isLiteral(expr.argument)) // 一元表达式如 !true
  );
}
