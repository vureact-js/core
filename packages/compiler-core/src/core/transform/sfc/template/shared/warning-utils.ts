import { ICompilationContext } from '@compiler/context/types';
import { DOLLAR_IDENTIFIERS } from '@consts/other';
import { logger } from '@shared/logger';
import { DirectiveNode, InterpolationNode, NodeTypes } from '@vue/compiler-core';

export function warnUnsupportedDirective(ctx: ICompilationContext, loc: any, rawName?: string) {
  const { source, filename } = ctx;

  logger.warn(`Unsupported or unknown directive: ${rawName}`, {
    loc,
    source,
    file: filename,
  });
}

export function warnUnsupportedVueDollarVar(
  ctx: ICompilationContext,
  node: DirectiveNode | InterpolationNode,
) {
  const { source, filename } = ctx;

  let value = '';
  let loc;

  if (node.type === NodeTypes.DIRECTIVE && node.exp?.type === NodeTypes.SIMPLE_EXPRESSION) {
    value = node.exp.content;
    loc = node.exp.loc;
  } else if (
    node.type === NodeTypes.INTERPOLATION &&
    node.content.type === NodeTypes.SIMPLE_EXPRESSION
  ) {
    value = node.content.content;
    loc = node.loc;
  }

  const dollar = DOLLAR_IDENTIFIERS.find((item) => value.includes(item));
  if (!dollar) return;

  logger.error(`Vue runtime ${dollar} is not supported as it cannot be analyzed.`, {
    source,
    loc,
    file: filename,
  });
}
