import { compileContext } from '@shared/compile-context';
import { logger } from '@shared/logger';

export * from './parse';
export * from './transform';
export * from './codegen';

export function compile() {
  // todo

  if (logger.getLogs().length) {
    logger.printAll();
  }

  compileContext.clear();
}
