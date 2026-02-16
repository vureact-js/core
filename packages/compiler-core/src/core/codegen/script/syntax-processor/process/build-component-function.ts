import * as t from '@babel/types';
import { ICompilationContext } from '@compiler/context/types';
import { COMP_PROPS_NAME } from '@consts/other';
import { ScriptBlockIR } from '@transform/script';
import { ScriptBuildState } from '..';
import { buildComponentName } from '../../utils/build-component-name';

export function buildComponentFunctionProcessor(
  nodeIR: ScriptBlockIR | null,
  ctx: ICompilationContext,
  state: ScriptBuildState,
) {
  const functionIdentifier = t.identifier(buildComponentName(ctx));
  const jsxReturnStatement = t.returnStatement((state.jsx || t.nullLiteral()) as t.Expression);

  if (!nodeIR) {
    state.componentFunction = t.functionExpression(
      functionIdentifier,
      [],
      t.blockStatement([jsxReturnStatement]),
    );
    return;
  }

  const localStatements = resolveLocalStatements(nodeIR);
  localStatements.push(jsxReturnStatement);

  const propsIdentifier = t.identifier(COMP_PROPS_NAME);
  const componentFunction = t.functionExpression(
    functionIdentifier,
    [propsIdentifier],
    t.blockStatement(localStatements),
  );

  attachPropsTypeAnnotation(nodeIR, ctx, propsIdentifier);

  state.componentFunction = componentFunction;
}

function resolveLocalStatements(nodeIR: ScriptBlockIR): t.Statement[] {
  const localNodeIR = nodeIR.statement.local as unknown;

  if (!localNodeIR) {
    return [];
  }

  if (Array.isArray(localNodeIR)) {
    return [...(localNodeIR as t.Statement[])];
  }

  if (typeof localNodeIR === 'object' && 'program' in (localNodeIR as object)) {
    const program = (localNodeIR as t.File).program;

    if (program?.body?.length) {
      return [...program.body];
    }
  }

  return [];
}

function attachPropsTypeAnnotation(
  nodeIR: ScriptBlockIR,
  ctx: ICompilationContext,
  propsIdentifier: t.Identifier,
) {
  const { scriptData } = ctx;

  if (!scriptData.lang.startsWith('ts')) {
    return;
  }

  const { name, propsTypes, emitTypes, slotTypes } = scriptData.propsTSIface;
  const hasProps = propsTypes.length > 0 && emitTypes.length > 0 && slotTypes.length > 0;
  const typeIdentifier = t.identifier(hasProps ? name : 'any');

  propsIdentifier.typeAnnotation = t.tsTypeAnnotation(t.tsTypeReference(typeIdentifier));

  void nodeIR;
}
