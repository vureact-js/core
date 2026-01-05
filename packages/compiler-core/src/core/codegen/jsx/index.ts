import { ReactIRDescriptor } from '@core/transform';
import { TemplateChildNodeIR } from '@core/transform/template';
import { compileContext } from '@src/shared/compile-context';
import { buildCtxProvider } from './builders/ctx-provider-builder';
import { buildElement } from './builders/element-builder';
import { buildFragment } from './builders/simple-builder';
import { JSXChild } from './types';

export function genJsx(ir: ReactIRDescriptor): JSXChild | null {
  const templateBlock = ir.template;

  if (!templateBlock?.children.length) {
    return null;
  }

  return buildChildren(templateBlock.children, true) as JSXChild;
}

export function buildChildren(
  children: TemplateChildNodeIR[],
  isRoot = false,
): JSXChild | JSXChild[] {
  const jsx = children.map(buildElement).filter(Boolean) as JSXChild[];

  if (isRoot) {
    const { ctxProvider } = compileContext.context;

    if (ctxProvider.exists) {
      return buildCtxProvider(ctxProvider, jsx);
    }

    return buildFragment(jsx);
  }

  return jsx;
}
