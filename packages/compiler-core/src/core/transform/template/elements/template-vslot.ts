import { ICompilationContext } from '@compiler/context/types';
import { NodeTypes, ElementNode as VueElementNode } from '@vue/compiler-core';
import { transformElements } from '.';
import { TemplateChildNodeIR } from '..';
import { handleVSlot, SlotPropsIR } from '../props/vslot';
import { ElementNodeIR } from './element';

export function transformVSlotNode(
  ctx: ICompilationContext,
  node: VueElementNode,
  nodeIR: ElementNodeIR,
) {
  let vslotIR = {} as SlotPropsIR;

  for (const prop of node.props) {
    if (prop.type === NodeTypes.DIRECTIVE) {
      vslotIR = handleVSlot(ctx, prop);
    }
  }

  const children: TemplateChildNodeIR[] = [];

  // 转换 <template v-slot> 的子节点内容
  transformElements(ctx, node, nodeIR, children);

  if (!vslotIR.isScoped) {
    vslotIR.content = children;
  } else {
    vslotIR.callback!.exp = children;
  }

  nodeIR.props.push(vslotIR);
}
