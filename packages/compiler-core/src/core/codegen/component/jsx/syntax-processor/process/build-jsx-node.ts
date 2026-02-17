import * as t from '@babel/types';
import { ICompilationContext } from '@compiler/context/types';
import { TemplateChildNodeIR } from '@src/core/transform/sfc/template';
import { BaseSimpleNodeIR } from '@src/core/transform/sfc/template/shared/node-ir-utils';
import { NodeTypes } from '@src/core/transform/sfc/template/shared/types';
import { ElementNodeIR } from '@src/core/transform/sfc/template/syntax-processor/process';
import { JSXChild } from '../../types';
import { buildElementNode } from './build-element-node';
import { buildJsxChildren } from './build-jsx-children';
import { buildFragmentNode, buildJsxExpressionNode, buildTextNode } from './build-simple-node';

export function buildJsxNode(
  nodeIR: TemplateChildNodeIR | t.Node,
  ctx: ICompilationContext,
): JSXChild | null {
  if (t.isNode(nodeIR)) {
    return nodeIR as JSXChild;
  }

  const simpleNodeIR = nodeIR as unknown as BaseSimpleNodeIR;

  if (nodeIR.type === NodeTypes.TEXT) {
    return buildTextNode(simpleNodeIR.content);
  }

  if (nodeIR.type === NodeTypes.COMMENT || nodeIR.type === NodeTypes.JSX_INTERPOLATION) {
    return buildJsxExpressionNode(simpleNodeIR.babelExp);
  }

  if (nodeIR.type === NodeTypes.FRAGMENT) {
    const fragmentNodeIR = nodeIR as unknown as ElementNodeIR;
    return buildFragmentNode(buildJsxChildren(fragmentNodeIR.children, ctx));
  }

  if (nodeIR.type === NodeTypes.ELEMENT) {
    return buildElementNode(nodeIR as ElementNodeIR, ctx);
  }

  return null;
}
