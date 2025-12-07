import { strCodeTypes } from '@src/shared/getStrCodeBabelType';
import { camelCase } from '@utils/camelCase';


export function parseStyleString(styleStr: string, isId: boolean): string {
  // 只检查动态绑定的 style 是否为 css text
  if (isId && !strCodeTypes.isStringLiteral(styleStr)) {
    return styleStr;
  }

  const trimmed = styleStr.trim();
  if (!trimmed) return '{}';

  const result: string[] = [];
  const obj = parseCssText(trimmed);

  for (const key in obj) {
    result.push(`${key}: '${obj[key]}'`);
  }

  return `{${result.join(',')}}`;
}

function parseCssText(cssText: string): Record<string, string> {
  const res: Record<string, string> = {};
  const listDelimiter = /;(?![^(]*\))/g; // 防止切分 url(...) 中的分号
  const propertyDelimiter = /:(.+)/;

  cssText.split(listDelimiter).forEach((item) => {
    if (!item) return;
    const tmp = item.split(propertyDelimiter);

    if (tmp.length > 1) {
      const k = tmp[0]!.trim();
      const v = tmp[1]!.trim();

      if (k && v) {
        res[camelCase(k)] = v;
      }
    }
  });
  return res;
}


export function isSimpleStyle(str: string): boolean {
  return str.startsWith('Object.assign') || strCodeTypes.isObjectLiteral(str);
}
