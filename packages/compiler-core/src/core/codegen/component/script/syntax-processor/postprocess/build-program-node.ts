import * as t from '@babel/types';
import { ICompilationContext } from '@compiler/context/types';
import { ScriptBlockIR } from '@transform/sfc/script';
import { ScriptBuildState } from '..';

export function buildProgramNode(
  nodeIR: ScriptBlockIR | null,
  ctx: ICompilationContext,
  state: ScriptBuildState,
) {
  const statements: t.Statement[] = [...state.preambleStatements];

  if (!state.component) {
    state.result = t.program(statements, undefined, 'module');
    return;
  }

  statements.push(state.component);

  if (state.expose) {
    const [declarator] = state.component.declarations;
    const { name } = declarator!.id as t.Identifier;
    statements.push(t.exportDefaultDeclaration(t.identifier(name)));
  }

  state.result = t.program(statements, undefined, 'module');

  void nodeIR;
  void ctx;
}
