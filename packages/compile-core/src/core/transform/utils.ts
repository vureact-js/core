import { ExpressionNode, NodeTypes } from '@vue/compiler-core';

export const isSimpleExp = (node?: ExpressionNode) => node?.type === NodeTypes.SIMPLE_EXPRESSION;
