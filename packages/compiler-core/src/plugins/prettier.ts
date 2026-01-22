import { logger } from '@shared/logger';
import { Options as PrettierOptions } from 'prettier';

export async function formatWithPrettier(
  code: string,
  /** 'js' | 'ts' | 'jsx' | 'tsx' */
  lang: string,
  opts?: PrettierOptions,
): Promise<string> {
  try {
    // 尝试导入，如果用户环境有就使用
    const prettier = await import('prettier');
    const parser = lang.startsWith('ts') ? 'babel-ts' : 'babel';

    return prettier.format(code, {
      printWidth: 80,
      tabWidth: 2,
      useTabs: false,
      semi: true,
      singleQuote: true,
      jsxSingleQuote: false,
      trailingComma: 'all',
      bracketSpacing: true,
      bracketSameLine: false,
      arrowParens: 'avoid',
      ...opts,
      parser,
    });
  } catch {
    // 用户没安装 Prettier，用简单格式化或直接返回
    logger.info('Prettier is unavailable; the built-in simple formatter is used.');
    return simpleFormat(code);
  }
}

/**
 * 极简兜底格式化函数
 * 目标：轻量、快速、保证最基本可读性
 */
export function simpleFormat(code: string): string {
  // 1. 规整空行：将3个及以上连续空行压缩为2个
  let formatted = code.replace(/\n\s*\n\s*\n/g, '\n\n');

  // 2. 确保文件以换行符结束（符合常见代码规范）
  if (!formatted.endsWith('\n')) {
    formatted += '\n';
  }

  return formatted;
}
