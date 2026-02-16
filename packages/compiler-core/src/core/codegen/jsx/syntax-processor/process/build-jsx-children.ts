import { ICompilationContext } from '@compiler/context/types';
import { TemplateBlockIR, TemplateChildNodeIR } from '@transform/template';
import { JsxBuildState } from '..';
import { JSXChild } from '../../types';
import { buildJsxNode } from './build-jsx-node';

export function buildJsxChildrenProcessor(
  nodeIR: TemplateBlockIR,
  ctx: ICompilationContext,
  state: JsxBuildState,
) {
  state.rootChildren = buildJsxChildren(nodeIR.children, ctx);
}

export function buildJsxChildren(
  nodeIR: TemplateChildNodeIR[],
  ctx: ICompilationContext,
): JSXChild[] {
  return nodeIR
    .map((childNodeIR) => buildJsxNode(childNodeIR, ctx))
    .filter((childNodeIR): childNodeIR is JSXChild => !!childNodeIR);
}
