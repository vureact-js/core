import { JSXElement, JSXFragment } from '@babel/types';
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
  const { rootChildren } = state;
  const { provide } = ctx.scriptData;

  const hasProvide = provide.isOccupied;
  const hasChildren = rootChildren.length > 0; // 是否有任意 jsx 节点

  const setResult = (elem?: JSXElement | JSXFragment) => {
    state.result = elem ?? null;
  };

  // 如果存在上下文提供者
  if (hasProvide) {
    const provider = buildCtxProviderNode(provide, ctx, rootChildren);

    // fix: https://github.com/vureact-js/core/issues/51
    if (!hasChildren) {
      // 根节点没有 children 时，创建一个包含提供者的片段节点
      setResult(buildFragmentNode([provider]));
    } else {
      setResult(provider);
    }

    return;
  }

  if (!hasChildren) {
    setResult();
    return;
  }

  setResult(buildFragmentNode(rootChildren));

  void nodeIR;
}
