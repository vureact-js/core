import { ICompilationContext } from '@compiler/context/types';
import { STYLE_MODULE_NAME } from '@consts/other';
import { processScopedWithPostCss } from '@plugins/postcss';
import { resolveLessSass } from '@plugins/resolve-less-sass';
import { logger } from '@shared/logger';
import { SFCDescriptor } from '@vue/compiler-sfc';
import { ParseResult } from '..';

export function resolveStyles(
  descriptor: SFCDescriptor,
  ctx: ICompilationContext,
  result: ParseResult,
) {
  const [style, ...blocks] = descriptor.styles;
  if (!style) return null;

  const { lang = 'css', content } = style;
  const { fileId, filename, styleData, preprocessStyles } = ctx;

  // 不支持多个 style 块
  if (blocks.length) {
    logger.warn(
      'Multiple style blocks detected. Only the first one is supported. Please merge the remaining styles manually.',
      { file: filename },
    );
  }

  // 对使用了 @import 语法进行警告
  if (content.includes('@import')) {
    logger.warn(
      'Detected @import in scoped style. Imported styles remain global. Consider inlining them to preserve scoping.',
      { file: filename },
    );
  }

  // 预处理样式
  const { code, fileExt } = resolveLessSass(content, {
    lang,
    filename,
    enabled: preprocessStyles,
  });

  let ext = fileExt;

  // 处理 css module
  if (style.module) {
    ext = `-${fileId}.module${ext}`;
    styleData.moduleName = typeof style.module === 'boolean' ? STYLE_MODULE_NAME : style.module;
  } else {
    ext = `-${fileId}${ext}`;
  }

  // 处理 scoped
  if (style.scoped) {
    // 不处理非 css 语言
    if (lang !== 'css' && !preprocessStyles) {
      logger.warn(
        'Scoped styles are only supported for CSS. Preprocessing is disabled, so scoped styles will not be applied.',
        { file: filename },
      );
      return;
    }

    // 使用 postcss 为每个选择器加上 id 值
    const result = processScopedWithPostCss(code, fileId);

    style.content = result.css.trim();
    styleData.scopeId = result.scopeId;
  } else {
    // 非 scoped 样式也需要更新编译后的内容
    style.content = code;
  }

  // 生成文件路径
  const filePath = filename.replace(/\.vue$/i, ext);
  styleData.filePath = filePath;

  result.style = {
    ast: undefined,
    source: style,
  };
}
