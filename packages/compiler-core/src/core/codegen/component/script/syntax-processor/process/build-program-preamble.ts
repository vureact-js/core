import * as t from '@babel/types';
import { ICompilationContext } from '@compiler/context/types';
import { ScriptBlockIR } from '@src/core/transform/sfc/script';
import { ScriptBuildState } from '..';

export function buildProgramPreambleProcessor(
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
