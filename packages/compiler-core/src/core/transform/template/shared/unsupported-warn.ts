import { ICompilationContext } from '@compiler/context/types';
import { logger } from '@src/shared/logger';
import { DirectiveNode, InterpolationNode, NodeTypes } from '@vue/compiler-core';

export function warnUnsupportedDirective(ctx: ICompilationContext, loc: any, rawName?: string) {
  const { source, filename } = ctx;
  logger.warn(`Unsupported or unknown directive: ${rawName}`, {
    loc,
    source,
    file: filename,
  });
}

export function warnVueDollarVar(
  ctx: ICompilationContext,
  node: DirectiveNode | InterpolationNode,
) {
  const { source, filename } = ctx;

  let value = '';
  let loc;

  if (node.type === NodeTypes.DIRECTIVE && node.exp?.type === NodeTypes.SIMPLE_EXPRESSION) {
    value = node.exp.content;
    loc = node.exp?.loc;
  } else if (
    node.type === NodeTypes.INTERPOLATION &&
    node.content.type === NodeTypes.SIMPLE_EXPRESSION
  ) {
    value = node.content.content;
    loc = node.loc;
  }

  const dollar = ['$attrs', '$slots', '$refs', '$emit', '$props'].find((d) => value.includes(d));

  if (dollar) {
    logger.error(
      `Unsupported template variable "${dollar}". ` +
        `Runtime-injected $ variables are intentionally not supported.`,
      {
        source,
        loc,
        file: filename,
      },
    );
  }
}
