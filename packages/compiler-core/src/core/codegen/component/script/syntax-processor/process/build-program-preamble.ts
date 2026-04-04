import * as t from '@babel/types';
import { ICompilationContext } from '@compiler/context/types';
import { ScriptBlockIR } from '@transform/sfc/script';
import { ScriptBuildState } from '..';

/**
 * 构建位于组件外的代码块，如 import/export/type
 */
export function buildProgramPreamble(
  nodeIR: ScriptBlockIR | null,
  ctx: ICompilationContext,
  state: ScriptBuildState,
) {
  const statements = [nodeIR?.imports, nodeIR?.tsTypes, nodeIR?.exports, nodeIR?.statement.global]
    .flat()
    .filter(Boolean);

  state.preambleStatements = statements as unknown as t.Statement[];

  void ctx;
}
