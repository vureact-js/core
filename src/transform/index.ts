import type { ParsedResult } from '@parse/types';
import { isNull } from '@utils/types';
import { insertUseFirstMountState, transformScript } from './transform-script';
import { processImports } from './transform-script/processImports';
import { transformTemplate } from './transform-template';
import { logger } from './utils/logger';

export default function transformer(ast: ParsedResult) {
  const jsx = transformTemplate(ast);
  const script = transformScript(ast);

  if (!isNull(script)) {
    insertUseFirstMountState(script.ast);
    processImports(script.ast, script.context);
  }

  logger.printAll();
}
