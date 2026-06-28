import * as t from '@babel/types';
import { ICompilationContext } from '@compiler/context/types';
import { MACRO_API_NAMES } from '@consts/other';
import { getReactiveStateApis, getReactiveType } from '@shared/reactive-utils';

/**
 * 收集响应式的变量绑定元数据
 */
export function resolveReactiveBindings(node: t.VariableDeclarator, ctx: ICompilationContext) {
  const { reactiveBindings } = ctx.templateData;
  const reactiveStateApis = getReactiveStateApis();

  const init = node.init! as t.CallExpression;
  const callName = (init.callee as t.Identifier).name;

  // 不是响应式API调用，直接返回
  if (!reactiveStateApis.has(callName)) {
    return;
  }

  // 获取变量名和值
  const varName = (node.id as t.Identifier).name;
  const initValue = init.arguments[0]! as t.Expression;

  // 收集绑定元数据
  reactiveBindings[varName] = {
    name: varName,
    value: initValue,
    source: callName,
    reactiveType: getReactiveType(callName),
  };

  // 收集 definProps/withDefaults 的变量名作为组件 props 名
  if (callName === MACRO_API_NAMES.props || callName === MACRO_API_NAMES.defaults) {
    ctx.propField = varName;
  }
}
