import { parse as babelParse } from '@babel/parser';
import { ICompilationContext } from '@compiler/context/types';
import { getBabelParseOptions, LangType } from '@shared/babel-utils';
import { executePlugins } from '@shared/plugin-executor';
import { ParseResult, ParserOptions } from './sfc';

/**
 * 仅用于解析 script 文件，参数与 parseSFC 一致
 */
export function parseOnlyScript(
  source: string,
  ctx: ICompilationContext,
  options?: ParserOptions,
): ParseResult {
  const lang = ctx.inputType.split('-')[1] as LangType;
  const ast = babelParse(source, getBabelParseOptions(lang, 'script', ctx.filename));

  const result: ParseResult = {
    template: null, // 没有template
    script: {
      ast,
      source: {
        type: 'script',
        content: source,
        lang,
        attrs: {},
        loc: {} as any,
      },
    },
    style: null, // 没有style
  };

  ctx.scriptData.lang = lang;
  ctx.scriptData.source = source;

  executePlugins(options?.plugins, result, ctx);

  return result;
}
