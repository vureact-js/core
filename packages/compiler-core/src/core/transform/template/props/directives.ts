import { SupportedDirectives } from '@consts/supportedDirectives';
import { compileContext } from '@shared/compile-context';
import { logger } from '@shared/logger';
import {
  DirectiveNode,
  SimpleExpressionNode,
  ElementNode as VueElementNode,
} from '@vue/compiler-core';
import { ElementNodeIR } from '../elements/node';
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

export function handleDirective(
  node: VueElementNode,
  prop: DirectiveNode,
  nodeIR: ElementNodeIR,
  nodesIR: ElementNodeIR[],
): boolean | void {
  const { name, exp, rawName } = prop;
  const propExp = exp as SimpleExpressionNode;

  // 未识别指令
  if (!SupportedDirectives.includes(name)) {
    logUnsupportedDirective(prop.loc, rawName);
    return;
  }

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
      handleVText(propExp.content, nodeIR);
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

function logUnsupportedDirective(loc: any, rawName?: string) {
  const { source, filename } = compileContext.context;
  logger.warn(`Unsupported or unknown directive: ${rawName}`, {
    loc,
    source,
    file: filename,
  });
}
