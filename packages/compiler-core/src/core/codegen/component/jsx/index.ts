import { ICompilationContext } from '@compiler/context/types';
import { TemplateBlockIR } from '@src/core/transform/sfc/template';
import { buildJSXChild } from './syntax-processor';
import { JSXChild } from './types';

export function buildJSX(
  nodeIR: TemplateBlockIR | null,
  ctx: ICompilationContext,
): JSXChild | null {
  if (!nodeIR?.children.length) {
    return null;
  }

  return buildJSXChild(nodeIR, ctx);
}
