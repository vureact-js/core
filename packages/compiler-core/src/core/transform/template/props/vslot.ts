import { ICompilationContext } from '@compiler/context/types';
import { DirectiveNode, SimpleExpressionNode } from '@vue/compiler-core';
import { PropTypes } from '.';
import { TemplateChildNodeIR } from '..';
import { checkPropIsDynamicKey } from '../shared/utils';

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

export function handleVSlot(ctx: ICompilationContext, prop: DirectiveNode): SlotPropsIR {
  const arg = prop.arg as SimpleExpressionNode;
  const exp = prop.exp as SimpleExpressionNode;

  const isScoped = exp !== undefined;
  const name = arg.content === 'default' ? 'children' : arg.content;

  const content = !isScoped ? [] : undefined;
  const callback = isScoped
    ? {
        arg: exp?.content ? `(${exp?.content})` : '()',
        exp: [],
      }
    : undefined;

  checkPropIsDynamicKey(ctx, prop);

  return {
    type: PropTypes.SLOT,
    name,
    rawName: prop.rawName ?? 'default',
    isStatic: arg.isStatic,
    isScoped,
    content,
    callback,
  };
}
