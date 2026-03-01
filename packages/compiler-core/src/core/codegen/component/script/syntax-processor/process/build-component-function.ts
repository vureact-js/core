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
  scriptIR: ScriptBlockIR | null,
  ctx: ICompilationContext,
  state: ScriptBuildState,
) {
  const { scriptData } = ctx;

  // 有脚本代码或 props 都采用 memo 策略
  const shouldMemo = scriptIR !== null || scriptData.propsTSIface.name !== '';

  const jsxStatement = t.returnStatement((state.jsx || t.nullLiteral()) as t.Expression);

  const component = !shouldMemo
    ? resolveComponent(jsxStatement, ctx)
    : resolveMemoComponent(scriptIR!.statement.local, jsxStatement, ctx);

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
  const propsIdentifier = t.identifier(propField);

  const getHasProps = (list: any[]) => Object.keys(list).length > 0;

  const hasProps =
    getHasProps(propsTSIface.propsTypes) ||
    getHasProps(propsTSIface.emitTypes) ||
    getHasProps(propsTSIface.slotTypes);

  // 有 props 但是 js 环境，直接返回参数名
  if (scriptData.lang.startsWith('js') && hasProps) {
    return propsIdentifier;
  }

  // 参数设置类型注解
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
