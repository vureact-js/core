import { Binding, NodePath } from '@babel/traverse';
import * as t from '@babel/types';
import { getReactiveStateApis } from '@shared/reactive-utils';
import { getVariableDeclaratorPath } from '../babel-utils';
import { isReactiveBinding } from './binding-utils';

/**
 * 判断绑定是否合格：
 * 1. 是否是 import 进来的
 * 2. 是否是 reactive/ref 等 API 声明的
 * 3. 是否是函数声明
 */
export function isEligibleBindingSource(binding: Binding): boolean {
  if (binding.kind === 'param') {
    return false;
  }

  const reactiveStateApis = getReactiveStateApis();
  const bindingPath = binding.path;
  const declaratorPath = getVariableDeclaratorPath(bindingPath);

  // 判断是否为响应式变量绑定
  const isReactiveVarBinding = !!declaratorPath && isReactiveBinding(declaratorPath.node);
  const nodeInit = declaratorPath?.node.init;

  // 判断是否为响应式 API 调用绑定（如 ref(), reactive() 等）
  const isReactiveApiCallVarBinding =
    !!declaratorPath &&
    t.isCallExpression(nodeInit) &&
    t.isIdentifier(nodeInit.callee) &&
    reactiveStateApis.has(nodeInit.callee.name);

  const isHookCallVarBinding =
    !!declaratorPath && t.isCallExpression(nodeInit) && isHookLikeCallee(nodeInit.callee);

  // 判断是否为函数绑定（函数声明或函数表达式）
  const isFunctionBinding =
    bindingPath.isFunctionDeclaration() ||
    (!!declaratorPath &&
      !!nodeInit &&
      (t.isArrowFunctionExpression(nodeInit) || t.isFunctionExpression(nodeInit)));

  // re: 仅当函数绑定被标记为响应式时，才允许作为依赖源
  const isReactiveFunctionBinding =
    isFunctionBinding &&
    (isReactiveBinding(declaratorPath?.node) || isReactiveBinding(bindingPath.node));

  return (
    isReactiveVarBinding ||
    isReactiveApiCallVarBinding ||
    isHookCallVarBinding ||
    isReactiveFunctionBinding
  );
}

/**
 * 判断判断是否为有效的响应式依赖表达式：
 * 1. 标识符是有效的（如 refVar）
 * 2. 成员表达式必须是静态成员链（所有属性访问都是静态的，最终对象是标识符）
 *    例如 state.count、props.value 有效，obj[prop]、obj[getKey()] 无效
 */
export function isReactValidDependencyExpr(node: t.Expression): boolean {
  if (t.isIdentifier(node)) {
    return true;
  }

  if (t.isMemberExpression(node) || t.isOptionalMemberExpression(node)) {
    return isStaticMemberChain(node);
  }

  return false;
}

/**
 * 检查是否为静态成员链：从当前节点开始向上遍历对象部分
 * 要求所有层级的属性访问都是静态的（非计算属性或计算属性为字面量）
 * 最终的对象部分必须是标识符
 */
function isStaticMemberChain(node: t.MemberExpression | t.OptionalMemberExpression): boolean {
  let current: t.Expression | t.Super = node;

  while (t.isMemberExpression(current) || t.isOptionalMemberExpression(current)) {
    // 非计算属性时，属性必须是标识符（例如 obj.prop）
    if (!current.computed && !t.isIdentifier(current.property)) {
      return false;
    }

    // 计算属性时，属性必须是字符串或数字字面量（例如 obj["prop"] 或 obj[0]）
    if (
      current.computed &&
      !t.isStringLiteral(current.property) &&
      !t.isNumericLiteral(current.property)
    ) {
      return false;
    }

    current = current.object;
  }

  // 最终的对象部分必须是标识符（例如 state 或 props）
  return t.isIdentifier(current);
}

/**
 * 判断调用表达式是否为 Hook 类型的调用
 * Hook 通常以 'use' 开头，如 useState、useEffect 等
 * 支持两种形式：
 * 1. 直接调用：useState()
 * 2. 成员调用：React.useState()
 */
export function isHookLikeCallee(callee: t.CallExpression['callee']): boolean {
  // 情况1：直接标识符调用，检查是否以 'use' 开头
  if (t.isIdentifier(callee)) {
    return callee.name.startsWith('use');
  }

  // 情况2：成员表达式调用（如 React.useState）
  // 要求：非计算属性且属性为标识符，同时属性名以 'use' 开头
  if (t.isMemberExpression(callee) && !callee.computed && t.isIdentifier(callee.property)) {
    return callee.property.name.startsWith('use');
  }

  // 其他情况均不视为 Hook 调用
  return false;
}
