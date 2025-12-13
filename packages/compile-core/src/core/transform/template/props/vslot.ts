import { DirectiveNode, SimpleExpressionNode } from '@vue/compiler-core';
import { PropTypes } from '.';
import { TemplateChildNodeIR } from '..';
import { checkPropIsDynamicKey } from '../shared/check-prop-dynamic-key';

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
  const params = exp?.content ? `(${exp?.content})` : '()';

  checkPropIsDynamicKey(prop);

  // slot prop 较特殊，在转换阶段不参与预解析

  return {
    type: PropTypes.SLOT,
    name: arg.content,
    rawName: prop.rawName ?? 'default',
    isStatic: arg.isStatic,
    callback: {
      arg: params,
      exp: [],
    },
  };
}
