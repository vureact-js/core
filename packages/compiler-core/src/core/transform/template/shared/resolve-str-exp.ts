import { parseExpression } from '@babel/parser';
import * as t from '@babel/types';
import { ICompilationContext } from '@compiler/context/types';
import { COMP_PROPS_NAME } from '@consts/other';
import { getBabelParseOptions, ParseContext } from '@shared/babel-utils';
import { camelCase } from '@src/utils/camelCase';
import { capitalize } from '@utils/capitalize';

/**
 * 解决 Vue 模板的各种 js 字符串表达式
 * @param jsExp 字符串的 js 表达式
 * @param isStringLiteral 是否纯文本
 * @param parseCtx babel 解析方式
 * @returns {t.Expression}
 */
export function resolveTemplateExp(
  ctx: ICompilationContext,
  jsExp: string,
  isStringLiteral: boolean = false,
  parseCtx: ParseContext = 'vueTemplate',
): t.Expression {
  if (isStringLiteral) {
    return t.stringLiteral(jsExp);
  }

  const { scriptData, filename } = ctx;
  const parseOpts = getBabelParseOptions(scriptData.lang, parseCtx, filename);

  jsExp = normalizePropValue(jsExp);

  try {
    const exp = parseExpression(jsExp, parseOpts);

    return exp;
  } catch {
    return t.identifier(jsExp);
  }
}

/**
 * 规范化一些特殊的 prop 值，使其符合 React/编译器规范
 */
export function normalizePropValue(v: string): string {
  let newVal = v;
  newVal = transformEmitToPropsCall(v);
  return newVal;
}

// 将 $$emits('event') 换成 $$props?.onEvent()
function transformEmitToPropsCall(code: string): string {
  const emitCallRE = /^$$emits*\(\s*['"`]([^'"`]+)['"`]\s*(?:,\s*(.*))?\s*\)$/;
  const match = code.trim().match(emitCallRE);

  if (!match) return code;

  const [, eventName, args] = match;

  const handlerName = eventName!
    .split(/[:\-]/)
    .map((part) => camelCase(capitalize(part)))
    .join('');

  const call = args ? `on${handlerName}(${args})` : `on${handlerName}()`;

  return `${COMP_PROPS_NAME}?.${call}`;
}

/**
 * 提取字符串链式访问的第一个标识符
 */
export function extractFirstIdentifier(expr: string): string | undefined {
  if (!expr || typeof expr !== 'string') return;

  const cleaned = expr.trim();

  // 匹配标识符，后面可能跟着各种访问操作符
  const pattern = /^([a-zA-Z_$][a-zA-Z0-9_$]*)(?:[\.\?\.\[\(].*)?$/;
  const match = pattern.exec(cleaned);
  return match?.[1];
}
