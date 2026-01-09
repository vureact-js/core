import { ICompilationContext } from '@compiler/context/types';
import { DirectiveNode, ElementNode as VueElementNode } from '@vue/compiler-core';
import { ElementNodeIR } from '../elements/element';
import { warnUnsupportedDirective, warnVueDollarVar } from '../shared/unsupported-warn';
import { handleDynamicAttribute } from './attributes';
import { isVBind, isVConditional, isVModel, isVOn } from './utils';
import { handleVFor } from './vfor';
import { handleVHtml } from './vhtml';
import { handleVIf } from './vif';
import { handleVMemo } from './vmemo';
import { handleVModel } from './vmodel';
import { handleEvent } from './von';
import { handleVShow } from './vshow';
import { handleVText } from './vtext';

const supported: string[] = [
  'text',
  'html',
  'show',
  'if',
  'else',
  'else-if',
  'for',
  'on',
  'once',
  'bind',
  'model',
  'cloak',
  'slot',
  'memo',
  'is',
];

export function handleDirective(
  ctx: ICompilationContext,
  node: VueElementNode,
  prop: DirectiveNode,
  nodeIR: ElementNodeIR,
  nodesIR: ElementNodeIR[],
): boolean | void {
  const { name, rawName } = prop;

  // 未识别指令
  if (!supported.includes(name)) {
    warnUnsupportedDirective(ctx, prop.loc, rawName);
    return;
  }

  warnVueDollarVar(ctx, prop);

  // v-if/else/else-if
  if (isVConditional(rawName)) {
    return handleVIf(ctx, prop, nodeIR, nodesIR);
  }

  // 处理精确匹配的指令
  switch (rawName) {
    case 'v-html':
      handleVHtml(ctx, prop, nodeIR);
      return true;

    case 'v-text':
      handleVText(ctx, prop, nodeIR);
      return true;

    case 'v-once':
    case 'v-memo':
      return handleVMemo(ctx, prop, nodeIR);

    case 'v-show':
      return handleVShow(ctx, prop, nodeIR);

    case 'v-for':
      return handleVFor(prop, nodeIR);
  }

  // 处理需要模式匹配的指令
  if (isVModel(rawName)) {
    return handleVModel(ctx, prop, node, nodeIR);
  }

  if (isVBind(rawName)) {
    return handleDynamicAttribute(ctx, prop, nodeIR);
  }

  if (isVOn(rawName)) {
    return handleEvent(ctx, prop, nodeIR);
  }
}
