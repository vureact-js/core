import * as t from '@babel/types';

/**
 * 获取依赖键名，用于去重
 */
export function getDependencyKey(exp: t.Expression): string {
  if (t.isIdentifier(exp)) {
    // 标识符：直接返回其名称作为依赖键
    return exp.name;
  }

  if (t.isMemberExpression(exp) || t.isOptionalMemberExpression(exp)) {
    // 成员表达式或可选链表达式：递归构建对象部分的键，并拼接属性访问部分
    const objectKey = getDependencyKey(exp.object as t.Expression);
    const opt = exp.optional ? '?' : '';

    // 情况1：非计算属性且属性为标识符（例如 obj.prop）
    if (!exp.computed && t.isIdentifier(exp.property)) {
      return `${objectKey}${opt}.${exp.property.name}`;
    }

    // 情况2：计算属性且属性为字符串或数字字面量（例如 obj["prop"] 或 obj[0]）
    if (t.isStringLiteral(exp.property) || t.isNumericLiteral(exp.property)) {
      return `${objectKey}${opt}[${JSON.stringify(exp.property.value)}]`;
    }

    // 情况3：其他计算属性（例如 obj[someVar]），使用通配符表示
    return `${objectKey}${opt}[*]`;
  }

  // 其他类型的表达式：返回其节点类型作为键
  return exp.type;
}
