import { ICompilationContext } from '@compiler/context/types';
import { TemplateBlockIR, TemplateChildNodeIR } from '@src/core/transform/sfc/template';
import { checkPropIsDynamicKey } from '@src/core/transform/sfc/template/shared/prop-ir-utils';
import { PropTypes } from '@src/core/transform/sfc/template/shared/types';
import { DirectiveNode, SimpleExpressionNode } from '@vue/compiler-core';

export interface SlotPropsIR {
  type: PropTypes.SLOT;
  name: string;
  rawName: string;
  isStatic: boolean;
  isScoped: boolean;
  content?: TemplateChildNodeIR[];
  callback?: {
    arg: string;
    exp: TemplateChildNodeIR[];
  };
}

export function resolveVSlotProp(
  node: DirectiveNode,
  _ir: TemplateBlockIR,
  ctx: ICompilationContext,
): SlotPropsIR {
  const arg = node.arg as SimpleExpressionNode;
  const exp = node.exp as SimpleExpressionNode;

  const isScoped = exp !== undefined;
  const name = arg.content === 'default' ? 'children' : arg.content;

  const content = !isScoped ? [] : undefined;
  const callback = isScoped
    ? {
        arg: exp?.content ? `(${exp?.content})` : '()',
        exp: [],
      }
    : undefined;

  checkPropIsDynamicKey(ctx, node);

  return {
    type: PropTypes.SLOT,
    name,
    rawName: node.rawName ?? 'default',
    isStatic: arg.isStatic,
    isScoped,
    content,
    callback,
  };
}
