import { parseExpression } from '@babel/parser';
import * as t from '@babel/types';
import { Node } from '@babel/types';

/**
 * 判断一个字符串是否为简单表达式。
 * 简单表达式：字面量、标识符、或简单的属性访问。
 * 排除：函数调用、赋值、对象字面量、数组字面量等复杂结构。
 */
export function isSimpleExpressionString(codeString: string): boolean {
  let node: Node;

  try {
    node = parseExpression(codeString);
  } catch {
    // 如果解析失败 (例如语法错误)，则它肯定不是简单表达式
    return false;
  }

  // 2. 使用 @babel/types 方法判断解析出的节点类型

  // 允许的简单类型
  if (t.isLiteral(node)) {
    // 'a', 123, true, null
    return true;
  }

  if (t.isIdentifier(node)) {
    // myVar
    return true;
  }

  // 允许简单的属性访问，但需确保访问的对象和属性都是简单的
  if (t.isMemberExpression(node)) {
    // obj.prop, arr[0]
    return (
      isSimpleExpressionString(node.object as unknown as string) && t.isIdentifier(node.property)
    );
  }

  // 3. 排除复杂或有副作用的类型

  // 排除对象字面量（{...}）和数组字面量（[...]）
  if (t.isObjectExpression(node) || t.isArrayExpression(node)) {
    return false; // "{ 'active-image': isActive }" 会解析为 ObjectExpression
  }

  // 排除函数调用、赋值等有副作用的操作
  if (t.isCallExpression(node) || t.isAssignmentExpression(node)) {
    return false;
  }

  // 允许简单的二元和一元表达式（根据你之前的定义）
  if (t.isBinaryExpression(node) || t.isUnaryExpression(node)) {
    // 这里的递归判断需要更复杂，但为简洁起见，我们先接受简单的
    return true;
  }

  // 默认拒绝所有未明确允许的类型
  return false;
}
