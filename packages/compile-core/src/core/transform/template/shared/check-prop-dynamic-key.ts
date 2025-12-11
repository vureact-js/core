import { compileContext } from '@shared/compile-context';
import { logger } from '@shared/logger';
import { DirectiveNode, SimpleExpressionNode } from '@vue/compiler-core';

export function checkPropIsDynamicKey(prop: DirectiveNode) {
  const isKeyStatic = (prop.arg as SimpleExpressionNode)?.isStatic;

  if (isKeyStatic === false) {
    const { source, filename } = compileContext.context;
    logger.warn(
      'Failed to analyze dynamic prop. Falling back to source content; please use an explicit prop.',
      {
        source,
        loc: prop.arg?.loc,
        file: filename,
      },
    );
  }
}
