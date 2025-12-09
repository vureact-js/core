import { ElementTypes, isVSlot, ElementNode as VueElementNode } from '@vue/compiler-core';

export const isSlotElement = (node: VueElementNode): boolean => {
  if (node.tagType === ElementTypes.TEMPLATE) {
    if (node.props[0] !== undefined) {
      return isVSlot(node.props[0]);
    }
  }

  return node.tagType === ElementTypes.SLOT;
};
