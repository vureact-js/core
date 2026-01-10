import * as t from '@babel/types';
import { ICompilationContext } from '@compiler/context/types';
import { ScriptBlockIR } from '@core/transform/script';
import { logger } from '@src/shared/logger';
import { camelCase } from '@utils/camelCase';
import { capitalize } from '@utils/capitalize';
import { PropsIntersectionType } from '../transform/const';
import { JSXChild } from './jsx/types';

export function genReactComponent(
  ctx: ICompilationContext,
  script: ScriptBlockIR | null,
  jsx: JSXChild | null,
  expose: boolean = true,
): t.Program {
  const statements = createPreamble(script);
  const compFn = buildMainFunction(ctx, script, jsx);

  if (expose) {
    statements.push(t.exportDefaultDeclaration(compFn));
  } else {
    statements.push(t.expressionStatement(compFn));
  }

  return t.program(statements, undefined, 'module');
}

function createPreamble(script: ScriptBlockIR | null): t.Statement[] {
  const statement = [script?.imports, script?.tsTypes, script?.exports, script?.statement.global]
    .flat()
    .filter(Boolean);

  return statement as unknown as t.Statement[];
}

function buildMainFunction(
  ctx: ICompilationContext,
  script: ScriptBlockIR | null,
  jsx: JSXChild | null,
): t.FunctionExpression {
  const fnId = t.identifier(getFnName(ctx));
  const jsxRoot = t.returnStatement((jsx || t.nullLiteral()) as t.Expression);

  if (!script) {
    return t.functionExpression(fnId, [], t.blockStatement([jsxRoot]));
  }

  const { scriptData } = ctx;
  const { statement, defineProps } = script;

  const localStmt = statement.local;
  localStmt.push(jsxRoot);

  const paramId = defineProps.id.typeName as t.Identifier;
  const fnExp = t.functionExpression(fnId, [paramId], t.blockStatement(localStmt));

  if (scriptData.lang.startsWith('ts')) {
    paramId.typeAnnotation = t.tsTypeAnnotation(
      t.tsTypeReference(t.identifier(PropsIntersectionType)),
    );
  }

  return fnExp;
}

function getFnName(ctx: ICompilationContext): string {
  const { funcName } = ctx;
  let name = '';

  if (!funcName) {
    logger.warn(
      `An unnamed component was detected. A temporary name '${funcName}' has been generated.`,
    );
  } else {
    name = capitalize(camelCase(funcName));
  }

  return name;
}
