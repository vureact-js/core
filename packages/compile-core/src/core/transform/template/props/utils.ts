import { RuntimeHelper } from '@core/transform/types';
import { vueAttrToReactProp } from '@utils/vueAttrToReactProp';
import { DirectiveNode, SimpleExpressionNode } from '@vue/compiler-core';
import { BlockTypes, ExpressionBlock, PropsIR } from '.';

export function createPropsIR(): PropsIR {
  return {
    attributes: [],
    slots: [],
    directives: [],
    eventBindings: [],
  };
}

export function createExpressionBlock(prop: DirectiveNode, type: BlockTypes): ExpressionBlock {
  const { name, rawName, modifiers } = prop;

  const arg = prop.arg as SimpleExpressionNode;
  const exp = prop.exp as SimpleExpressionNode;

  const block: ExpressionBlock = {
    type,
    rawName,
    name: vueAttrToReactProp(arg?.content || name),
    exp: {
      complete: false,
      content: exp?.content || 'true',
    },
    modifiers: modifiers.map((m) => m.content),
    isStatic: arg?.isStatic || false,
    runtimeHelper: {} as RuntimeHelper['runtimeHelper'],
  };

  // v-for 会被转成 htmlFor，需要转回来
  if (block.rawName === 'v-for') {
    block.name = 'for';
  }

  return block;
}

export function isVOn(name?: string): boolean {
  return name?.startsWith('@') || name?.startsWith('v-on:') || false;
}

export function isVSlot(name?: string): boolean {
  return name?.startsWith('#') || name?.startsWith('v-slot') || false;
}

export function isVBind(name?: string): boolean {
  return name?.startsWith(':') || name?.startsWith('v-bind:') || false;
}

export function isVModel(name?: string): boolean {
  return !!name?.match('v-model')?.length;
}
