import { capitalize } from '@utils/capitalize';
import { ExpressionNode, NodeTypes } from '@vue/compiler-core';

export const isSimpleExp = (node?: ExpressionNode) => node?.type === NodeTypes.SIMPLE_EXPRESSION;

export const createVModelEvName = (modelName: string) => `onUpdate${capitalize(modelName)}`;
