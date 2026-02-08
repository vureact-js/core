import { ICompilationContext } from '@compiler/context/types';
import { STYLE_MODULE_NAME } from '@consts/other';
import { processScopedWithPostCss } from '@plugins/postcss';
import { logger } from '@shared/logger';
import { SFCStyleBlock } from '@vue/compiler-sfc';
import { basename } from 'path';
import { VueASTDescriptor } from '.';

export function parseStyle(
  styles: SFCStyleBlock[],
  ctx: ICompilationContext,
): VueASTDescriptor['style'] {
  const [style, ...more] = styles;

  if (!style) return null;

  if (more.length) {
    logger.warn(
      'Multiple style blocks detected. Only the first one is supported. Please merge the remaining styles manually.',
      { file: ctx.filename },
    );
  }

  if (style.content.includes('@import')) {
    logger.warn(
      'Detected @import in scoped style. Imported styles remain global. Consider inlining them to preserve scoping.',
      { file: ctx.filename },
    );
  }

  const { fileId, filename, styleData } = ctx;

  let fileExt = `.${style.lang || 'css'}`;

  if (style.module) {
    fileExt = `-${fileId}.module${fileExt}`;
    styleData.moduleName = typeof style.module === 'boolean' ? STYLE_MODULE_NAME : style.module;
  } else {
    fileExt = `-${fileId}${fileExt}`;
  }

  if (style.scoped) {
    const result = processScopedWithPostCss(style.content, fileId);
    style.content = result.css.trim();
    styleData.scopeId = result.scopeId;
  }

  const filePath = filename.replace(/\.vue$/i, fileExt);
  const bNs = basename(filePath);

  styleData.filePath = filePath.replace(bNs, bNs.toLowerCase());

  return {
    source: style,
    ast: undefined,
  };
}
