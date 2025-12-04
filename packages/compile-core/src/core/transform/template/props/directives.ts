import {
  DirectiveNode,
  SimpleExpressionNode,
  ElementNode as VueElementNode,
} from '@vue/compiler-core';
import { handleAttributeBlock } from './attributes';
import { handleEventBlock } from './eventBindings';
import { BlockTypes, ExpressionBlock, PropsIR } from './index';
import { handleSlotDirective } from './slots';
import { createExpressionBlock, isVBind, isVModel, isVOn, isVSlot } from './utils';
import { parseVForExp, VForParseResult } from './vfor';
import { handleVModel } from './vmodel';

export type DirectiveBlock = ExpressionBlock & {
  exp: {
    content: string;
    /* 像 v-for 等特殊表达式需进一步解析 */
    parsed?: Partial<ParsedDirectiveExp>;
  };
};

export interface ParsedDirectiveExp {
  for: VForParseResult;
}

export function handleOrdinaryDirective(
  node: VueElementNode,
  prop: DirectiveNode,
  propsIR: PropsIR,
): void {
  const { rawName } = prop;

  const arg = prop.arg as SimpleExpressionNode;
  const exp = prop.exp as SimpleExpressionNode;

  if (rawName === 'v-show') {
    handleAttributeBlock({
      propsIR,
      name: 'style',
      value: `{display: ${exp.content} ? '' : 'none'}`,
      isStaticKey: true,
      isStaticValue: exp.isStatic,
    });
    return;
  }

  if (isVModel(rawName)) {
    handleVModel(node, prop, propsIR);
    return;
  }

  if (isVBind(rawName)) {
    handleAttributeBlock({
      propsIR,
      name: arg.content,
      value: exp.content,
      isStaticKey: arg.isStatic,
      isStaticValue: exp.isStatic,
    });
    return;
  }

  if (isVOn(rawName)) {
    handleEventBlock(prop, propsIR);
    return;
  }

  if (isVSlot(rawName)) {
    handleSlotDirective(prop, propsIR);
    return;
  }
}

export function handleSpecialDirective(prop: DirectiveNode, propsIR: PropsIR): void {
  const arg = prop.arg as SimpleExpressionNode;
  const exp = prop.exp as SimpleExpressionNode;

  const name = arg?.content || prop.rawName || prop.name;
  const value = exp?.content || 'true';

  const block = createExpressionBlock(prop, BlockTypes.DIRECTIVE) as DirectiveBlock;

  if (name === 'v-for') {
    block.exp.parsed = { for: parseVForExp(value) };
  }

  block.exp.content = value;
  propsIR.directives.push(block);
}
