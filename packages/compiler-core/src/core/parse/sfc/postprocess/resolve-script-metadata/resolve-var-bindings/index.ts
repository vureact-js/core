import * as t from '@babel/types';
import { ICompilationContext } from '@compiler/context/types';
import { resolveReactiveBindings } from './resolve-reactive-bindings';
import { resolveTemplateRefBindings } from './resolve-template-ref-bindings';

/**
 * 收集变量绑定元数据
 */
export function resolveVarBindings(node: t.VariableDeclarator, ctx: ICompilationContext) {
  const { init, id } = node;

  if (!t.isIdentifier(id) || !init) {
    return;
  }

  const isCallExpr = t.isCallExpression(init) && t.isIdentifier(init.callee);

  // 针对初始值为调用表达式的变量进行收集
  if (isCallExpr) {
    resolveReactiveBindings(node, ctx);
    resolveTemplateRefBindings(node, ctx);
  }
}
