import { strCodeTypes } from '@src/shared/getStrCodeBabelType';
import { camelCase } from '@utils/camelCase';

export function parseStyleString(styleStr: string): string {
  if (!strCodeTypes.isStringLiteral(styleStr)) {
    return styleStr;
  }

  const trimmed = styleStr.trim();

  if (!trimmed) return '{}';

  const newStr = styleStr.split('');

  // 去除首尾引号
  newStr.shift();
  newStr.pop();

  const pairs = newStr
    .join('')
    .split(';')
    .map((p) => p.trim())
    .filter(Boolean) // 过滤空字符串
    .map((p) => {
      const colonIndex = p.indexOf(':');

      if (colonIndex === -1) return null; // 无效格式

      const key = p.slice(0, colonIndex).trim();
      const value = p.slice(colonIndex + 1).trim();

      if (!key || !value) return null; // 键或值缺失

      return { key, value };
    })
    .filter(Boolean) as Array<{ key: string; value: string }>;

  if (pairs.length === 0) return '{}';

  const obj = pairs.map(({ key, value }) => `${camelCase(key)}:'${value}'`).join(',');

  return `{${obj}}`;
}

export function isSimpleStyle(str: string): boolean {
  return str.startsWith('Object.assign') || strCodeTypes.isObjectLiteral(str);
}
