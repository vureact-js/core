import { Expression, JSXIdentifier } from '@babel/types';
import { NodeTypes, ElementNode as VueElementNode } from '@vue/compiler-core';
import { ElementNodeIR } from '../elements/node';
import { handleAttribute } from './attributes';
import { handleDirective } from './directives';

export interface PropsIR {
  type: PropTypes;
  rawName?: string;
  name: string;
  isStatic?: boolean;
  modifiers?: string[];
  value: PropIRValue;
  isKeyLessVBind?: boolean;
  babelExp: PropIRBabelExp<JSXIdentifier | Expression>;
}

export enum PropTypes {
  ATTRIBUTE = 1,
  SLOT = 2,
  EVENT = 3,
  DYNAMIC_ATTRIBUTE = 4,
}

export type PropIRValue = {
  content: string;
  isStringLiteral?: boolean;
  merge?: string[];
  babelExp: PropIRBabelExp;
};

export type PropIRBabelExp<T = Expression> = {
  content: string;
  ast: T;
};

export function transformProps(
  node: VueElementNode,
  nodeIR: ElementNodeIR,
  nodesIR: ElementNodeIR[],
) {
  for (const prop of node.props) {
    if (prop.type === NodeTypes.ATTRIBUTE) {
      handleAttribute(prop, nodeIR);
      continue;
    }

    if (prop.type === NodeTypes.DIRECTIVE) {
      const stop = handleDirective(node, prop, nodeIR, nodesIR);
      if (stop) break;
    }
  }
}
