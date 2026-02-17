import { ICompilationContext } from '@compiler/context/types';
import { TemplateBlockIR, TemplateChildNodeIR } from '@src/core/transform/sfc/template';
import { NodeTypes, ElementNode as VueElementNode } from '@vue/compiler-core';
import { SlotPropsIR, resolveVSlotProp } from './props';
import { ElementNodeIR } from './resolve-element-node';
import { resolveChildNodes } from './resolve-template-children';

export function resolveTemplateVSlotNode(
  node: VueElementNode,
  ir: TemplateBlockIR,
  ctx: ICompilationContext,
  nodeIR: ElementNodeIR,
) {
  let slotIR = {} as SlotPropsIR;

  for (const prop of node.props) {
    if (prop.type === NodeTypes.DIRECTIVE) {
      slotIR = resolveVSlotProp(prop, ir, ctx);
    }
  }

  const children: TemplateChildNodeIR[] = [];

  resolveChildNodes(node, ir, ctx, nodeIR, children);

  if (!slotIR.isScoped) {
    slotIR.content = children;
  } else {
    slotIR.callback!.exp = children;
  }

  nodeIR.props.push(slotIR);
}
