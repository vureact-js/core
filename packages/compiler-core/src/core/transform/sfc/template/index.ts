import { ICompilationContext } from '@compiler/context/types';
import { RootNode as VueRootNode } from '@vue/compiler-core';
import { BaseSimpleNodeIR, FragmentNodeIR } from './shared/node-ir-utils';
import { processVueTemplateSyntax } from './syntax-processor';
import { ElementNodeIR } from './syntax-processor/process';

export interface TemplateBlockIR {
  children: TemplateChildNodeIR[];
}

export type TemplateChildNodeIR = ElementNodeIR | BaseSimpleNodeIR | FragmentNodeIR;

export function resolveTemplate(
  root: VueRootNode | undefined,
  ctx: ICompilationContext,
): TemplateBlockIR {
  const ir: TemplateBlockIR = {
    children: [],
  };

  if (!root) return ir;

  processVueTemplateSyntax(root, ir, ctx);

  return ir;
}
