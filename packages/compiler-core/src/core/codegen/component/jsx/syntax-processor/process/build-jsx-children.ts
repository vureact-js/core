import { ICompilationContext } from '@compiler/context/types';
import { TemplateBlockIR, TemplateChildNodeIR } from '@src/core/transform/sfc/template';
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
  children: TemplateChildNodeIR[],
  ctx: ICompilationContext,
): JSXChild[] {
  const result: JSXChild[] = [];

  for (const childIR of children) {
    const jsxNode = buildJsxNode(childIR, ctx);
    if (!jsxNode) continue;
    result.push(jsxNode);
  }

  return result;
}
