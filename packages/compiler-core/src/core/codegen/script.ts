import * as t from '@babel/types';
import { ScriptBlockIR } from '@core/transform/script';
import { compileContext } from '@shared/compile-context';
import { logger } from '@src/shared/logger';
import { camelCase } from '@utils/camelCase';
import { capitalize } from '@utils/capitalize';
import { randomHash } from '@utils/random-hash';
import { PropsIntersectionType } from '../transform/const';

export function genReactComponent(
  script: ScriptBlockIR | null,
  jsxRoot: t.Expression,
  expose: boolean = true,
): t.Program {
  const statements = createPreamble(script);
  const fnExp = buildMainFunction(script);
  const fnReturnStmt = t.returnStatement(jsxRoot);

  fnExp.body.body.push(fnReturnStmt);

  if (expose) {
    statements.push(t.exportDefaultDeclaration(fnExp));
  } else {
    statements.push(t.expressionStatement(fnExp));
  }

  return t.program(statements, undefined, 'module');
}

function createPreamble(script: ScriptBlockIR | null): t.Statement[] {
  const statement = [script?.imports, script?.tsTypes, script?.exports, script?.statement.global]
    .flat()
    .filter(Boolean);

  return statement as unknown as t.Statement[];
}

function buildMainFunction(script: ScriptBlockIR | null): t.FunctionExpression {
  const { lang } = compileContext.context;
  const fnId = t.identifier(getCompName());

  if (!script) {
    return t.functionExpression(fnId, [], t.blockStatement([]));
  }

  const param = script.defineProps.id.typeName as t.Identifier;
  const body = t.blockStatement(script.statement.local);
  const fnExp = t.functionExpression(fnId, [param], body);

  if (lang.script.startsWith('ts')) {
    param.typeAnnotation = t.tsTypeAnnotation(
      t.tsTypeReference(t.identifier(PropsIntersectionType)),
    );
  }

  return fnExp;
}

function getCompName(): string {
  const { filename: name } = compileContext.context;
  let compName = camelCase(capitalize(name));

  if (!name) {
    compName = `RC${randomHash(8)}`;
    logger.warn(
      `An unnamed component was detected. A temporary name '${compName}' has been generated.`,
    );
  }

  return compName;
}
