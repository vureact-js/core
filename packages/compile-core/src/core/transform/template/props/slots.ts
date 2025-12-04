import { DirectiveNode } from '@vue/compiler-core';
import { BlockTypes, ExpressionBlock, PropsIR } from './index';
import { createExpressionBlock } from './utils';

export type SlotBlock = ExpressionBlock;

export function handleSlotDirective(prop: DirectiveNode, propIR: PropsIR): void {
  const expNodeIR = createExpressionBlock(prop, BlockTypes.SLOT);
  propIR.slots.push(expNodeIR);
}
