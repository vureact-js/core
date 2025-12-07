import { getContext } from '@core/transform/context';
import { isSupportedDirectives } from '@shared/isSupportedDirectives';
import { logger } from '@shared/logger';
import {
  DirectiveNode,
  SimpleExpressionNode,
  ElementNode as VueElementNode,
} from '@vue/compiler-core';
import { ElementNodeIR } from '../nodes/element';
import { handleDynamicAttribute } from './attributes';
import { handleEvent } from './events';
import { isVBind, isVConditional, isVModel, isVOn, isVSlot } from './utils';
import { handleVFor } from './vfor';
import { handleVHtml } from './vhtml';
import { handleVIf } from './vif';
import { handleVMemo } from './vmemo';
import { handleVModel } from './vmodel';
import { handleVShow } from './vshow';
import { handleVSlot } from './vslot';
import { handleVText } from './vtext';

export function handleDirective(
  node: VueElementNode,
  prop: DirectiveNode,
  nodeIR: ElementNodeIR,
  nodesIR: ElementNodeIR[],
): boolean | void {
  const { exp, rawName } = prop;
  const propExp = exp as SimpleExpressionNode;

  // 未识别指令
  if (!isSupportedDirectives(rawName)) {
    const { source, filename } = getContext();
    logger.warn(`Unknown directive: ${rawName}`, {
      loc: node.loc,
      source,
      file: filename,
    });
    return;
  }

  // 精确匹配指令
  // v-if/else/else-if
  if (isVConditional(rawName)) return handleVIf(prop, nodeIR, nodesIR);

  // 精确匹配指令
  switch (rawName) {
    case 'v-html':
      return (handleVHtml(prop, nodeIR), true);
    case 'v-text':
      return (handleVText(propExp.content, nodeIR), true);
    case 'v-once':
    case 'v-memo':
      return handleVMemo(prop, nodeIR);
    case 'v-show':
      return handleVShow(prop, nodeIR);
    case 'v-for':
      return handleVFor(prop, nodeIR);
  }

  // 泛匹配指令
  if (isVModel(rawName)) return handleVModel(prop, node, nodeIR);
  if (isVBind(rawName)) return handleDynamicAttribute(prop,node, nodeIR);
  if (isVOn(rawName)) return handleEvent(prop, nodeIR);
  if (isVSlot(rawName)) return handleVSlot(prop, nodeIR, nodesIR);
}
