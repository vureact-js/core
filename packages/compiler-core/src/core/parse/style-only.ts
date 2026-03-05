import { ICompilationContext } from '@compiler/context/types';
import { resolveLessSass } from '@plugins/resolve-less-sass';
import { logger } from '@shared/logger';
import { executePlugins } from '@shared/plugin-executor';
import { ParseResult, ParserOptions } from './sfc';

/**
 * 仅用于解析 style 文件
 */
export function parseOnlyStyle(
  source: string,
  ctx: ICompilationContext,
  options?: ParserOptions,
): ParseResult {
  const { filename } = ctx;

  let lang = filename.split('.').pop();
  if (!lang) {
    lang = 'css';
    logger.warn(`The style file without an extension has been fallback to .css`, {
      file: filename,
    });
  }

  const { code, fileExt } = resolveLessSass(source, {
    filename,
    lang,
    enabled: ctx.preprocessStyles,
  });

  const result: ParseResult = {
    template: null,
    script: null,
    style: {
      source: {
        type: 'style',
        content: code,
        lang: fileExt.replace('.', ''),
        attrs: {} as any,
        loc: {} as any,
      },
      ast: undefined,
    },
  };

  executePlugins(options?.plugins, result, ctx);

  return result;
}

