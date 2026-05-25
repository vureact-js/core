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
  children: TemplateChildNodeIR[] | undefined | null,
  ctx: ICompilationContext,
): JSXChild[] {
  const result: JSXChild[] = [];
  const normalizedChildren = Array.isArray(children) ? children : [];

  // fix: https://github.com/vureact-js/core/issues/45
  // 复杂 slot / template 组合下，某些中间节点可能暂时没有 children。
  // 这里统一按空数组处理，避免 codegen 在遍历阶段直接抛错。
  for (const childIR of normalizedChildren) {
    const jsxNode = buildJsxNode(childIR, ctx);
    if (!jsxNode) continue;
    result.push(jsxNode);
  }

  return result;
}
