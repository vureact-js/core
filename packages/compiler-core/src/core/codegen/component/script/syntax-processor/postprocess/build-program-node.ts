import * as t from '@babel/types';
import { ICompilationContext } from '@compiler/context/types';
import { ScriptBlockIR } from '@src/core/transform/sfc/script';
import { ScriptBuildState } from '..';

export function buildProgramNodeProcessor(
  nodeIR: ScriptBlockIR | null,
  ctx: ICompilationContext,
  state: ScriptBuildState,
) {
  const statements: t.Statement[] = [...state.preambleStatements];

  if (!state.componentFunction) {
    state.result = t.program(statements, undefined, 'module');
    return;
  }

  if (state.expose) {
    statements.push(t.exportDefaultDeclaration(state.componentFunction));
  } else {
    statements.push(t.expressionStatement(state.componentFunction));
  }

  state.result = t.program(statements, undefined, 'module');

  void nodeIR;
  void ctx;
}
