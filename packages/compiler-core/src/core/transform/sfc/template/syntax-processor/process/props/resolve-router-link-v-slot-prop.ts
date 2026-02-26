import { ICompilationContext } from '@compiler/context/types';
import { checkPropIsDynamicKey } from '@src/core/transform/sfc/template/shared/prop-ir-utils';
import { PropTypes } from '@src/core/transform/sfc/template/shared/types';
import { DirectiveNode, SimpleExpressionNode } from '@vue/compiler-core';
import { SlotPropsIR } from './resolve-v-slot-prop';
import { ElementNodeIR } from '../resolve-element-node';
import { PropsIR } from './resolve-props';

export function resolveRouterLinkVSlotProp(
  node: DirectiveNode,
  nodeIR: ElementNodeIR,
  ctx: ICompilationContext,
) {
  const arg = node.arg as SimpleExpressionNode | undefined;
  const exp = node.exp as SimpleExpressionNode | undefined;

  checkPropIsDynamicKey(ctx, node);

  const propIR: SlotPropsIR = {
    type: PropTypes.SLOT,
    name: 'customRender',
    rawName: node.rawName ?? 'v-slot',
    isStatic: arg?.isStatic ?? true,
    isScoped: true,
    callback: {
      arg: exp?.content?.trim() ?? '',
      exp: [],
    },
  };

  nodeIR.props.push(propIR);
}
