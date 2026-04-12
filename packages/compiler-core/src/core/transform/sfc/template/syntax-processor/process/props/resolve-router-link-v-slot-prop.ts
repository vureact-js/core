import { ICompilationContext } from '@compiler/context/types';
import { checkPropIsDynamicKey } from '@transform/sfc/template/shared/prop-ir-utils';
import { PropTypes } from '@transform/sfc/template/shared/types';
import { DirectiveNode, SimpleExpressionNode } from '@vue/compiler-core';
import { ElementNodeIR } from '../resolve-element-node';
import { SlotPropsIR } from './resolve-v-slot-prop';

export function resolveRouterLinkVSlotProp(
  directive: DirectiveNode,
  nodeIR: ElementNodeIR,
  ctx: ICompilationContext,
) {
  const arg = directive.arg as SimpleExpressionNode | undefined;
  const exp = directive.exp as SimpleExpressionNode | undefined;

  checkPropIsDynamicKey(ctx, directive);

  const propIR: SlotPropsIR = {
    type: PropTypes.SLOT,
    name: 'customRender',
    rawName: directive.rawName ?? 'v-slot',
    isStatic: arg?.isStatic ?? true,
    isScoped: true,
    callback: {
      arg: exp?.content?.trim() ?? '',
      exp: [],
    },
  };

  nodeIR.props.push(propIR);
}
