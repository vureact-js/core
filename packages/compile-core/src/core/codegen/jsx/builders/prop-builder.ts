import { ElementNodeIR } from '@src/core/transform/template/elements/node';
import { PropTypes } from '@src/core/transform/template/props';
import { SlotPropsIR } from '@src/core/transform/template/props/vslot';
import { JSXProp } from '../types';
import { buildElement } from './element-builder';

export function buildProps(propsIR: ElementNodeIR['props']): JSXProp[] {
  const props: JSXProp[] = [];

  for (const propIR of propsIR) {
    if (propIR.type === PropTypes.SLOT) {
      const slotProp = propIR as SlotPropsIR;
      const slotRoot = slotProp.callback.exp;

      if (slotRoot[0]) {
        buildElement(slotRoot[0]);
      }

      continue;
    }
  }

  return props;
}

export function createProp(name: string, value: string, isStatic: boolean) {}
