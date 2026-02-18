import * as t from '@babel/types';
import { ICompilationContext } from '@compiler/context/types';
import { ScriptBlockIR } from '@src/core/transform/sfc/script';
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

  const componentFunction = t.functionExpression(
    functionIdentifier,
    [],
    t.blockStatement(localStatements),
  );

  state.componentFunction = resolvePropParam(componentFunction, ctx);
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

function resolvePropParam(fn: t.FunctionExpression, ctx: ICompilationContext) {
  const { propField, scriptData } = ctx;
  const { propsTSIface } = scriptData;

  if (!scriptData.lang.startsWith('ts') || !propsTSIface.name) {
    return fn;
  }

  const propsIdentifier = t.identifier(propField);
  const typeIdentifier = t.identifier(propsTSIface.name);

  propsIdentifier.typeAnnotation = t.tsTypeAnnotation(t.tsTypeReference(typeIdentifier));

  fn.params.push(propsIdentifier);

  return fn;
}
