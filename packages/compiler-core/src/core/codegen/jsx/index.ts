import { ICompilationContext } from '@compiler/context/types';
import { ReactIRDescriptor } from '@core/transform';
import { TemplateChildNodeIR } from '@core/transform/template';
import { buildCtxProvider } from './builders/ctx-provider-builder';
import { buildElement } from './builders/element-builder';
import { buildFragment } from './builders/simple-builder';
import { JSXChild } from './types';

export function genJsx(ctx: ICompilationContext, ir: ReactIRDescriptor): JSXChild | null {
  const templateBlock = ir.template;

  if (!templateBlock?.children.length) {
    return null;
  }

  return buildChildren(ctx, templateBlock.children, true) as JSXChild;
}

export function buildChildren(
  ctx: ICompilationContext,
  children: TemplateChildNodeIR[],
  isRoot = false,
): JSXChild | JSXChild[] {
  const jsx = children.map((n) => buildElement(ctx, n)).filter(Boolean) as JSXChild[];

  if (isRoot) {
    const { provide } = ctx.scriptData;

    if (provide.isOccupied) {
      return buildCtxProvider(provide, jsx);
    }

    return buildFragment(jsx);
  }

  return jsx;
}
