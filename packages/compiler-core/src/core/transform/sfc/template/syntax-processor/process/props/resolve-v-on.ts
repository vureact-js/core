import * as t from '@babel/types';
import { ICompilationContext } from '@compiler/context/types';
import { stringToExpr } from '@shared/babel-utils';
import { camelCase } from '@utils/camelCase';
import { capitalize } from '@utils/capitalize';
import { DirectiveNode, SimpleExpressionNode } from '@vue/compiler-core';
import { TemplateBlockIR } from '../../../';
import { createPropsIR, findSameProp, resolvePropAsBabelExp } from '../../../shared/prop-ir-utils';
import { mergePropsIR } from '../../../shared/prop-merge-utils';
import { resolveSpecialExpression } from '../../../shared/resolve-string-expression';
import { PropTypes } from '../../../shared/types';
import { ElementNodeIR } from '../resolve-element-node';

export function resolveVOn(
  directive: DirectiveNode,
  ir: TemplateBlockIR,
  ctx: ICompilationContext,
  nodeIR: ElementNodeIR,
) {
  const arg = directive.arg as SimpleExpressionNode;
  const exp = directive.exp as SimpleExpressionNode | undefined;

  const modifiers = directive.modifiers.map((item) => item.content);
  const captureIndex = resolveCaptureModifier(modifiers);

  const eventName = resolveEventName(arg.content, captureIndex);

  // fix: https://github.com/vureact-js/core/issues/43
  // 兼容 `@click.stop` 这类仅带修饰符、不带表达式的事件写法。
  // 运行时修饰符工具可以正确处理 `undefined` handler，因此这里兜底为 `undefined`。
  const handlerContent = exp?.content?.trim() || 'undefined';

  const handler = resolveHandler(handlerContent, ctx, modifiers);
  const originalVueEventName = modifiers.length ? `${arg.content}.${modifiers.join('.')}` : '';
  const eventIR = createPropsIR(directive.rawName!, eventName, handler);

  eventIR.type = PropTypes.EVENT;
  eventIR.isStatic = arg.isStatic;
  eventIR.modifiers = modifiers;

  (eventIR as any).__vOnEvName = originalVueEventName;

  resolvePropAsBabelExp(eventIR, ctx);

  delete (eventIR as any).__vOnEvName;

  const existing = findSameProp(nodeIR.props, eventIR);

  if (existing) {
    mergePropsIR(ctx, existing, eventIR);
    return;
  }

  nodeIR.props.push(eventIR);
}

/**
 * 查找并移除 `capture` 修饰符，返回其索引；若不存在则返回 -1
 */
function resolveCaptureModifier(modifiers: string[]): number {
  const captureIndex = modifiers.findIndex((modifier) => modifier === 'capture');

  if (captureIndex > -1) {
    modifiers.splice(captureIndex, 1);
  }

  return captureIndex;
}

/**
 * 处理事件名：
 * - 将 `update:modelValue` 等 Vue 格式转为 `onUpdateModelValue` 格式
 * - 如有 capture 修饰符则在事件名后追加 `Capture`
 */
function resolveEventName(rawEventName: string, captureIndex: number): string {
  let eventName = normalizeVOnEventName(rawEventName);

  if (captureIndex > -1) {
    eventName = `${eventName}Capture`;
  }

  return eventName;
}

function normalizeVOnEventName(rawEventName: string): string {
  const segments = rawEventName
    .split(/[:-]/g)
    .map((segment) => segment.trim())
    .filter(Boolean);

  const normalized = segments.map((segment) => capitalize(camelCase(segment))).join('');

  return `on${normalized}`;
}

/**
 * 处理事件处理器：
 * - 首先通过 resolveSpecialExpression 解析特殊模板表达式
 * - 当没有修饰符时，进一步处理：
 *   1. console.xxx() 纯调用转为空函数
 *   2. 非"函数引用/函数表达式"的表达式包裹箭头函数 `() => {...}`
 */
function resolveHandler(
  handlerContent: string,
  ctx: ICompilationContext,
  modifiers: string[],
): string {
  let handler = resolveSpecialExpression(handlerContent, ctx);

  // 有修饰符时，修饰符由运行时处理，不在此处转换 handler
  if (modifiers.length) {
    return handler;
  }

  const expr = stringToExpr(handler);

  // 例如 @click="console.xxx()"，在 React 中没有实际意义，直接转为空函数
  if (isConsoleCall(expr)) {
    return '() => {}';
  }

  // fix：https://github.com/vureact-js/core/issues/24
  // 仅当表达式不是"函数引用/函数表达式"时，才包一层事件回调函数
  if (!isFnReference(expr)) {
    handler = `() => {${handler}}`;
  }

  return handler;
}

/**
 * 判断表达式是否为 console.xxx() 调用
 */
function isConsoleCall(expr: t.Expression): boolean {
  return (
    t.isCallExpression(expr) &&
    t.isMemberExpression(expr.callee) &&
    t.isIdentifier(expr.callee.object) &&
    expr.callee.object.name === 'console'
  );
}

/**
 * 判断表达式是否本身已是"可作事件回调的引用"：
 *  - Identifier: log, handleClick
 *  - MemberExpression: obj.method, a.b.c
 *  - FunctionExpression / ArrowFunctionExpression: function(){}, ()=>{}
 */
function isFnReference(expr: t.Expression): boolean {
  return t.isIdentifier(expr) || t.isMemberExpression(expr) || t.isFunction(expr);
}
