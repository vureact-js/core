import { logger } from '@transform/utils/logger';
import { isNull } from '@utils/types';
import type { ParsedResult } from 'parse/types';
import { collectNeededImports } from './collectNeededImports';
import { stripAllValues } from './stripAllValues';
import { transformAssignments } from './transformAssignments';
import { transformCallbacks } from './transformFunction';
import { transformLifecycle } from './transformLifecycle';
import { transformNextTick } from './transformNextTick';
import { transformDefinePropsEmits } from './transformPropsEmits';
import { transformReactive } from './transformReactive';
import { transformHooks } from './transformWatch';
import type { ScriptInfo, ScriptTransformContext } from './types';
import { createContext, createUseFirstMountState } from './utils';

export function transformScript(ast: ParsedResult): ScriptInfo | null {
  const { script, filename } = ast;
  if (isNull(script?.file)) return null;

  logger.addContext(filename, script.sourceCode);

  const context = createContext();
  processScript(script.file, context);
  logger.printAll();
  return { ast: script.file, context };
}

function processScript(ast: ScriptInfo['ast'], context: ScriptTransformContext) {
  const plugins: ((ast: ScriptInfo['ast'], ctx: ScriptTransformContext) => void)[] = [
    collectNeededImports,
    transformDefinePropsEmits,
    transformReactive,
    stripAllValues,
    transformHooks,
    transformLifecycle,
    transformCallbacks,
    transformNextTick,
    transformAssignments,
  ];
  for (const plugin of plugins) {
    plugin(ast, context);
  }
}

export function insertUseFirstMountState(ast: ScriptInfo['ast']) {
  const decl = createUseFirstMountState();
  const body = ast.program.body;
  body.unshift(decl);
}
