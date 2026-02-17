import { ICompilationContext } from '@compiler/context/types';
import { RootNode as VueRootNode } from '@vue/compiler-core';
import { TemplateBlockIR } from '..';
import { resolveBuiltInComponentRules } from './postprocess';
import { resolveStyleModuleReference, resolveStyleScopeAttribute } from './preprocess';
import { resolveTemplateChildren } from './process';

interface ProcessorOptions {
  preprocess: TemplateProcessor[];
  process: TemplateProcessor[];
  postprocess: TemplateProcessor[];
}

type TemplateProcessor = (node: VueRootNode, ir: TemplateBlockIR, ctx: ICompilationContext) => void;

export function processVueTemplateSyntax(
  node: VueRootNode,
  ir: TemplateBlockIR,
  ctx: ICompilationContext,
) {
  templateSyntaxProcessor(node, ir, ctx, {
    preprocess: [resolveStyleScopeAttribute, resolveStyleModuleReference],
    process: [resolveTemplateChildren],
    postprocess: [resolveBuiltInComponentRules],
  });
}

function templateSyntaxProcessor(
  node: VueRootNode,
  ir: TemplateBlockIR,
  ctx: ICompilationContext,
  options: ProcessorOptions,
) {
  const run = (p: TemplateProcessor[]) => {
    p.forEach((handler) => handler(node, ir, ctx));
  };

  run(options.preprocess);
  run(options.process);
  run(options.postprocess);
}
