import { DirectiveNode, SimpleExpressionNode } from '@vue/compiler-core';
import { PropTypes } from '.';
import { TemplateChildNodeIR } from '..';

export interface SlotPropsIR {
  type: PropTypes.SLOT;
  name: string;
  rawName: string;
  isStatic: boolean;
  callback: {
    arg: string;
    exp: TemplateChildNodeIR[];
  };
}

export function handleVSlot(prop: DirectiveNode): SlotPropsIR {
  const arg = prop.arg as SimpleExpressionNode;
  const exp = prop.exp as SimpleExpressionNode;

  return {
    type: PropTypes.SLOT,
    name: arg.content,
    rawName: prop.rawName ?? 'default',
    isStatic: arg.isStatic,
    callback: {
      arg: exp?.content,
      exp: [],
    },
  };
}
