import { NodeTypes, ElementNode as VueElementNode } from '@vue/compiler-core';
import { transformChildren } from '.';
import { handleVSlot, SlotPropsIR } from '../props/vslot';
import { wrapWithFragmentIR } from '../shared/fragment';
import { ElementNodeIR } from './element';

export function handleTemplateSlot(tmplSlotNode: VueElementNode, parentIR: ElementNodeIR) {
  let slotPropIR = {} as SlotPropsIR;

  // <template v-slot> 插槽属性有且只能同时存在一个

  for (const slotProp of tmplSlotNode.props) {
    if (slotProp.type === NodeTypes.DIRECTIVE) {
      slotPropIR = handleVSlot(slotProp);
    }
  }

  const slotContent = slotPropIR.callback.exp;

  transformChildren(tmplSlotNode, parentIR, slotContent);

  slotPropIR.callback.exp = wrapWithFragmentIR(slotContent);

  parentIR.props.push(slotPropIR);
}
