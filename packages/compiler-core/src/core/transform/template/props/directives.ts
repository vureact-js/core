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
  node: VueElementNode,
  prop: DirectiveNode,
  nodeIR: ElementNodeIR,
  nodesIR: ElementNodeIR[],
): boolean | void {
  const { name, rawName } = prop;

  // 未识别指令
  if (!supported.includes(name)) {
    warnUnsupportedDirective(prop.loc, rawName);
    return;
  }

  warnVueDollarVar(prop);

  // v-if/else/else-if
  if (isVConditional(rawName)) {
    return handleVIf(prop, nodeIR, nodesIR);
  }

  // 处理精确匹配的指令
  switch (rawName) {
    case 'v-html':
      handleVHtml(prop, nodeIR);
      return true;

    case 'v-text':
      handleVText(prop, nodeIR);
      return true;

    case 'v-once':
    case 'v-memo':
      return handleVMemo(prop, nodeIR);

    case 'v-show':
      return handleVShow(prop, nodeIR);

    case 'v-for':
      return handleVFor(prop, nodeIR);
  }

  // 处理需要模式匹配的指令
  if (isVModel(rawName)) {
    return handleVModel(prop, node, nodeIR);
  }

  if (isVBind(rawName)) {
    return handleDynamicAttribute(prop, node, nodeIR);
  }

  if (isVOn(rawName)) {
    return handleEvent(prop, nodeIR);
  }
}
