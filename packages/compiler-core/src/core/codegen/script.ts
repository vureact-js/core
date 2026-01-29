import * as t from '@babel/types';
import { ICompilationContext } from '@compiler/context/types';
import { ScriptBlockIR } from '@core/transform/script';
import { camelCase } from '@utils/camelCase';
import { capitalize } from '@utils/capitalize';
import { genHashByXXH } from '@utils/hash';
import { basename } from 'path';
import { PropsIntersectionType } from '../transform/const';
import { JSXChild } from './jsx/types';

export function genReactComponent(
  ctx: ICompilationContext,
  script: ScriptBlockIR | null,
  jsx: JSXChild | null,
  expose: boolean = true,
): t.Program {
  const statements = createPreamble(script);
  const compFn = buildCompFunc(ctx, script, jsx);

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

function buildCompFunc(
  ctx: ICompilationContext,
  script: ScriptBlockIR | null,
  jsx: JSXChild | null,
): t.FunctionExpression {
  const fnId = t.identifier(resolveCompName(ctx));
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

function resolveCompName(ctx: ICompilationContext): string {
  const { funcName, filename } = ctx;

  // 如果没有用 defineOptions 定义组件名，则默认使用文件名，兜底用文件哈希
  const name = !funcName
    ? basename(filename).split('.')[0] || `C${genHashByXXH(filename)}`
    : funcName;

  return capitalize(camelCase(name));
}
