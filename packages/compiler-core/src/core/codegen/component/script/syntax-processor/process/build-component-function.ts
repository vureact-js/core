import { ParseResult } from '@babel/parser';
import * as t from '@babel/types';
import { ICompilationContext } from '@compiler/context/types';
import { REACT_API_MAP } from '@consts/react-api-map';
import { ScriptBlockIR } from '@transform/sfc/script';
import { camelCase } from '@utils/camelCase';
import { capitalize } from '@utils/capitalize';
import { genHashByXXH } from '@utils/hash';
import { basename } from 'path';
import { ScriptBuildState } from '..';

export function buildComponent(
  nodeIR: ScriptBlockIR | null,
  ctx: ICompilationContext,
  state: ScriptBuildState,
) {
  const jsxStatement = t.returnStatement((state.jsx || t.nullLiteral()) as t.Expression);

  const component = !nodeIR
    ? resolveComponent(jsxStatement, ctx)
    : resolveMemoComponent(nodeIR.statement.local, jsxStatement, ctx);

  state.component = component;
}

function resolveComponent(jsxStmt: t.ReturnStatement, ctx: ICompilationContext) {
  return t.variableDeclaration('const', [
    t.variableDeclarator(
      resolveComponentName(ctx),
      t.arrowFunctionExpression([], t.blockStatement([jsxStmt])),
    ),
  ]);
}

function resolveMemoComponent(
  local: ParseResult<t.File> | null,
  jsxStmt: t.ReturnStatement,
  ctx: ICompilationContext,
): t.VariableDeclaration {
  const name = resolveComponentName(ctx);
  const param = resolveParam(ctx);

  const component = t.arrowFunctionExpression(
    !param ? [] : [param],
    t.blockStatement(resolveStatements(local, jsxStmt)),
  );

  const memoCall = t.callExpression(t.identifier(REACT_API_MAP.memo), [component]);

  return t.variableDeclaration('const', [t.variableDeclarator(name, memoCall)]);
}

function resolveComponentName(ctx: ICompilationContext): t.Identifier {
  const { filename, compName } = ctx as ICompilationContext;

  const name = !compName
    ? basename(filename).split('.')[0] || `C${genHashByXXH(filename)}`
    : compName;

  return t.identifier(capitalize(camelCase(name)));
}

function resolveParam(ctx: ICompilationContext): t.Identifier | undefined {
  const { propField, scriptData } = ctx;
  const { propsTSIface } = scriptData;

  if (!propsTSIface.name) return;

  const propsIdentifier = t.identifier(propField);

  if (!scriptData.lang.startsWith('ts') && propsTSIface.name) {
    return propsIdentifier;
  }

  const typeIdentifier = t.identifier(propsTSIface.name);
  propsIdentifier.typeAnnotation = t.tsTypeAnnotation(t.tsTypeReference(typeIdentifier));

  return propsIdentifier;
}

function resolveStatements(
  local: ParseResult<t.File> | null,
  jsx: t.ReturnStatement,
): t.Statement[] {
  const stmts: t.Statement[] = [jsx];

  if (!local) return stmts;

  if (typeof local === 'object' && 'program' in (local as object)) {
    const program = (local as t.File).program;

    if (program?.body?.length) {
      return [...program.body, jsx];
    }
  }

  return stmts;
}
