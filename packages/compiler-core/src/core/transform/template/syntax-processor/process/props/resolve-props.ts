import { Expression, JSXIdentifier } from '@babel/types';
import { ICompilationContext } from '@compiler/context/types';
import { TemplateBlockIR } from '@transform/template';
import { BabelExp, PropTypes } from '@transform/template/shared/types';
import { DirectiveNode, NodeTypes, ElementNode as VueElementNode } from '@vue/compiler-core';
import { ElementNodeIR } from '../resolve-element-node';
import { resolveAttributeProp } from './resolve-attribute-prop';
import { resolveDirectiveProp } from './resolve-directive-prop';

export interface PropsIR {
  type: PropTypes;
  rawName?: string;
  name: string;
  isStatic?: boolean;
  modifiers?: string[];
  value: PropIRValue;
  isKeyLessVBind?: boolean;
  babelExp: BabelExp<JSXIdentifier | Expression>;
}

export type PropIRValue = {
  content: string;
  isStringLiteral?: boolean;
  merge?: string[];
  babelExp: BabelExp;
};

export function resolveProps(
  node: VueElementNode,
  ir: TemplateBlockIR,
  ctx: ICompilationContext,
  nodeIR: ElementNodeIR,
  siblingNodesIR: ElementNodeIR[],
) {
  for (const prop of node.props) {
    if (prop.type === NodeTypes.ATTRIBUTE) {
      resolveAttributeProp(prop, ir, ctx, nodeIR);
      continue;
    }

    if (prop.type === NodeTypes.DIRECTIVE) {
      const stop = resolveDirectiveProp(
        prop as DirectiveNode,
        ir,
        ctx,
        node,
        nodeIR,
        siblingNodesIR,
      );

      if (stop) {
        break;
      }
    }
  }
}
