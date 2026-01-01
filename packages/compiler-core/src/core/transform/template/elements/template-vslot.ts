import { NodeTypes, ElementNode as VueElementNode } from '@vue/compiler-core';
import { transformNodes } from '.';
import { handleVSlot, SlotPropsIR } from '../props/vslot';
import { ElementNodeIR } from './element';
import { TemplateChildNodeIR } from '..';

export function transformVSlotNode(node: VueElementNode, nodeIR: ElementNodeIR) {
  let vslotIR = {} as SlotPropsIR;

  for (const prop of node.props) {
    if (prop.type === NodeTypes.DIRECTIVE) {
      vslotIR = handleVSlot(prop);
    }
  }

  const children: TemplateChildNodeIR[] = [];

  // 转换 <template v-slot> 的子节点内容
  transformNodes(node, nodeIR, children);

  if (!vslotIR.isScoped) {
    vslotIR.content = children;
  } else {
    vslotIR.callback!.exp = children;
  }

  nodeIR.props.push(vslotIR);
}
