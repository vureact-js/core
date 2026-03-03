import { ParseResult } from '@babel/parser';
import * as t from '@babel/types';
import { ICompilationContext } from '@compiler/context/types';
import { REACT_API_MAP } from '@consts/react-api-map';
import { logger } from '@src/shared/logger';
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
  const {
    scriptData: { propsTSIface },
  } = ctx;

  const hasProps =
    getHasProps(propsTSIface.propsTypes) ||
    getHasProps(propsTSIface.emitTypes) ||
    getHasProps(propsTSIface.slotTypes);

  // 有脚本代码或 props 都采用 memo 策略
  const shouldMemo = scriptIR !== null || hasProps;

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

  let name = compName;

  if (!name) {
    // 没有设置组件名则回退到文件名/随机名
    name = basename(filename).split('.')[0] || `FC${genHashByXXH(filename)}`;
  }

  name = capitalize(camelCase(name));

  if (!compName) {
    logger.warn('Missing component name, it falls back to the filename. ' + name, {
      file: filename,
    });
  }

  return t.identifier(name);
}

function resolveParam(ctx: ICompilationContext): t.Identifier | undefined {
  const { propField, scriptData } = ctx;
  const { propsTSIface } = scriptData;
  const propsIdentifier = t.identifier(propField);

  // 有 props 但是 js 环境，直接返回参数名
  if (scriptData.lang.startsWith('js')) {
    // 即使没有收集 props 类型，但只要疑似有 props 则返回 props 参数名
    if (propsTSIface.hasPropsInJsEnv) {
      return propsIdentifier;
    }

    // 没有 props 返回 undefined
    return;
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

function getHasProps(list: any[]): boolean {
  return Object.keys(list).length > 0;
}
