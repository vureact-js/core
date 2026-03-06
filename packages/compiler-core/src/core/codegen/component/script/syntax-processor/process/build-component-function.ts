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

  // 将 JSX 包裹在 return 语句
  const jsxStatement = t.returnStatement((state.jsx || t.nullLiteral()) as t.Expression);

  const component = !shouldMemo
    ? resolvePureUIComponent(jsxStatement, ctx)
    : resolveMemoComponent(scriptIR!.statement.local, jsxStatement, ctx);

  state.component = component;
}

function getHasProps(list: any[]): boolean {
  // 检查数组是否包含元素，用于判断是否存在props/emit/slot等属性
  return list.length > 0;
}

// 纯 UI 组件
function resolvePureUIComponent(jsxStmt: t.ReturnStatement, ctx: ICompilationContext) {
  // 创建普通函数组件，无 props 和 script 逻辑，纯 UI 组件
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
  // 解析组件名称
  const name = resolveComponentName(ctx);

  // 解析组件参数（props）
  const param = resolvePropsParam(ctx);

  // 函数体：合并脚本语句和 JSX 返回语句
  const body = t.blockStatement(resolveLocalStatements(local, jsxStmt));

  // 创建组件函数
  const component = resolveComponent(param, body, ctx);

  let compFn: t.ArrowFunctionExpression | t.CallExpression = component;

  // 组件是否需要 forwardRef 包裹
  if (ctx.scriptData.forwardRef.enabled) {
    compFn = resolveForwardRef(body, ctx);
  }

  // 使用React.memo包裹组件进行性能优化
  const memoCall = t.callExpression(t.identifier(REACT_API_MAP.memo), [compFn]);

  // 返回常量变量声明：const ComponentName = React.memo(...)
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

function resolveLocalStatements(
  local: ParseResult<t.File> | null,
  jsx: t.ReturnStatement,
): t.Statement[] {
  // 初始化语句数组，默认包含JSX返回语句
  const stmts: t.Statement[] = [jsx];

  // 如果没有脚本代码，直接返回仅包含JSX的数组
  if (!local) return stmts;

  // 检查local是否为有效的Babel解析结果（包含program属性）
  if (typeof local === 'object' && 'program' in (local as object)) {
    const program = (local as t.File).program;

    // 如果program存在且包含语句体，将脚本所有语句与JSX返回语句合并
    if (program?.body?.length) {
      return [...program.body, jsx];
    }
  }

  // 如果local存在但不是有效结构，返回仅包含JSX的默认数组
  return stmts;
}

// 处理生成何种组件函数
function resolveComponent(
  param: t.Identifier | undefined,
  body: t.BlockStatement,
  ctx: ICompilationContext,
): t.ArrowFunctionExpression | t.CallExpression {
  const {
    scriptData: { forwardRef },
  } = ctx;

  // forwardRef 包裹
  if (forwardRef.enabled) {
    return resolveForwardRef(body, ctx);
  }

  // 标准组件函数
  const baseComponent = t.arrowFunctionExpression(!param ? [] : [param], body);
  return baseComponent;
}

// 处理 forwardRef 包裹组件
function resolveForwardRef(body: t.BlockStatement, ctx: ICompilationContext) {
  const {
    propField,
    scriptData: { forwardRef, lang },
  } = ctx;

  const params = [t.identifier(forwardRef.refField)];
  const propsId = resolvePropsParam(ctx);

  // 创建 forwardRef 调用表达式
  const callExpr = t.callExpression(t.identifier(REACT_API_MAP.forwardRef), [
    t.arrowFunctionExpression(params, body),
  ]);

  // 处理泛型参数
  if (lang.startsWith('ts')) {
    const types: t.TSType[] = [t.tsAnyKeyword()];

    // 当只有 props 参数存在时，才尝试添加其泛型参数
    if (propsId) {
      // @ts-ignore
      const propsType = propsId?.typeAnnotation?.typeAnnotation as t.TSType;
      types.push(propsType || t.tsAnyKeyword());
    }

    // 设置泛型参数
    callExpr.typeParameters = t.tsTypeParameterInstantiation(types);
  }

  // 如果 props 参数存在则加入到 ref 参数前面
  if (propsId) {
    // 清除类型注释
    propsId.typeAnnotation = null;
    params.unshift(propsId);
  }

  return callExpr;
}

// 处理 props 参数
function resolvePropsParam(ctx: ICompilationContext): t.Identifier | undefined {
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

  // TypeScript 环境：只有在有有效的 props 类型名称时才返回参数
  if (!propsTSIface.name) {
    // 没有 props 类型名称，返回 undefined
    return;
  }

  // 参数设置类型注解
  const typeIdentifier = t.identifier(propsTSIface.name);
  propsIdentifier.typeAnnotation = t.tsTypeAnnotation(t.tsTypeReference(typeIdentifier));

  return propsIdentifier;
}
