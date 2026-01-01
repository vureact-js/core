import { parseExpression } from '@babel/parser';
import * as t from '@babel/types';
import { getBabelParseOptions, ParseContext } from '@src/shared/babel-utils';
import { compileContext } from '@src/shared/compile-context';
import { camelCase } from '@src/utils/camelCase';
import { capitalize } from '@src/utils/capitalize';
import { __emits, __props } from '../../const';

/**
 * 解决 Vue 模板的各种 js 字符串表达式
 * @param jsExp 字符串的 js 表达式
 * @param isStringLiteral 是否纯文本
 * @param parseCtx babel 解析方式
 * @returns {t.Expression}
 */
export function resolveTemplateExp(
  jsExp: string,
  isStringLiteral: boolean = false,
  parseCtx: ParseContext = 'vueTemplate',
): t.Expression {
  if (isStringLiteral) {
    return t.stringLiteral(jsExp);
  }

  const { lang, filename, templateVar } = compileContext.context;
  const parseOpts = getBabelParseOptions(lang.script, parseCtx, filename);

  if (jsExp.startsWith(__emits)) {
    // 将 __emits('click') 换成 __props?.onClick()
    jsExp = transformEmitToPropsCall(jsExp);
  }

  try {
    const exp = parseExpression(jsExp, parseOpts);

    if (t.isIdentifier(exp)) {
      // 记录模板使用的所有变量名
      templateVar.ids.add(exp.name);
    }

    return exp;
  } catch {
    return t.identifier(jsExp);
  }
}

function transformEmitToPropsCall(code: string): string {
  const emitCallRE = /^__emits*\(\s*['"`]([^'"`]+)['"`]\s*(?:,\s*(.*))?\s*\)$/;
  const match = code.trim().match(emitCallRE);

  if (!match) return code;

  const [, eventName, args] = match;

  const handlerName = eventName!
    .split(/[:\-]/)
    .map((part) => camelCase(capitalize(part)))
    .join('');

  const call = args ? `on${handlerName}(${args})` : `on${handlerName}()`;

  return `${__props}?.${call}`;
}
