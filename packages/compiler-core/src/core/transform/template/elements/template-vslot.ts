import { NodeTypes, ElementNode as VueElementNode } from '@vue/compiler-core';
import { transformNodes } from '.';
import { handleVSlot, SlotPropsIR } from '../props/vslot';
import { ElementNodeIR } from './element';

export function transformVSlotNode(node: VueElementNode, nodeIR: ElementNodeIR) {
  let slotPropIR = {} as SlotPropsIR;

  for (const prop of node.props) {
    if (prop.type === NodeTypes.DIRECTIVE) {
      slotPropIR = handleVSlot(prop);
    }
  }

  // 转换 <template v-slot> 的子节点内容
  transformNodes(node, nodeIR, slotPropIR.callback.exp);

  nodeIR.props.push(slotPropIR);
}
