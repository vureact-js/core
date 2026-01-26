import { ICompilationContext } from '@compiler/context/types';
import { styleModule } from '@consts/other';
import { processScopedWithPostCss } from '@plugins/postcss';
import { logger } from '@shared/logger';
import { genHashByXXH } from '@src/utils/hash';
import { SFCStyleBlock } from '@vue/compiler-sfc';
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

  let fileExt = `.${style.lang || 'css'}`;

  // 生成样式文件id
  const hashId = genHashByXXH(`${ctx.filename}${fileExt}`);

  if (style.module) {
    fileExt = `_${hashId}.module${fileExt}`;
    ctx.styleData.moduleName = typeof style.module === 'boolean' ? styleModule : style.module;
  } else {
    fileExt = `_${hashId}${fileExt}`;
  }

  if (style.scoped) {
    const result = processScopedWithPostCss(style.content, hashId);
    style.content = result.css;
    ctx.styleData.scopeId = result.scopeId;
  }

  const filePath = ctx.filename.replace(/\.vue$/i, fileExt);
  ctx.styleData.filePath = filePath;

  return {
    source: style,
    ast: undefined,
  };
}
