import { compileContext } from '@shared/compile-context';
import { logger } from '@shared/logger';
import { DirectiveNode, SimpleExpressionNode } from '@vue/compiler-core';

export function checkPropIsDynamicKey(prop: DirectiveNode) {
  const isKeyStatic = (prop.arg as SimpleExpressionNode)?.isStatic;
  const { source, filename } = compileContext.context;

  if (prop.rawName === 'v-bind' && !prop.name) {
    logger.warn('Keyless v-bind will overwrite all previously declared props at runtime.', {
      source,
      loc: prop.arg?.loc,
      file: filename,
    });
    return;
  }

  if (isKeyStatic === false) {
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
