import { ICompilationContext } from '@compiler/context/types';
import { TemplateBlockIR } from '@src/core/transform/sfc/template';
import { JsxBuildState } from '..';
import { buildFragmentNode } from '../process';
import { buildCtxProviderNode } from './build-ctx-provider';

export function buildRootJsxProcessor(
  nodeIR: TemplateBlockIR,
  ctx: ICompilationContext,
  state: JsxBuildState,
) {
  if (!state.rootChildren.length) {
    state.result = null;
    return;
  }

  const { provide } = ctx.scriptData;

  if (provide.isOccupied) {
    state.result = buildCtxProviderNode(provide, ctx, state.rootChildren);
    return;
  }

  state.result = buildFragmentNode(state.rootChildren);

  void nodeIR;
}
