import { strCodeTypes } from '@shared/string-code-types';
import { camelCase } from '@utils/camelCase';

export function parseStyleString(styleStr: string): string {
  if (isSimpleStyle(styleStr) || strCodeTypes.isIdentifier(styleStr)) {
    return styleStr;
  }

  const trimmed = styleStr.trim();
  if (!trimmed) {
    return '{}';
  }

  const result: string[] = [];
  const styleObject = parseCssText(trimmed);

  for (const key in styleObject) {
    result.push(`${key}: '${styleObject[key]}'`);
  }

  return `{${result.join(',')}}`;
}

function parseCssText(cssText: string): Record<string, string> {
  const result: Record<string, string> = {};
  const listDelimiter = /;(?![^(]*\))/g;
  const propertyDelimiter = /:(.+)/;

  cssText.split(listDelimiter).forEach((item) => {
    if (!item) {
      return;
    }

    const parts = item.split(propertyDelimiter);

    if (parts.length > 1) {
      const key = parts[0]!.trim();
      const value = parts[1]!.trim();

      if (key && value) {
        result[camelCase(key)] = value;
      }
    }
  });

  return result;
}

export function isSimpleStyle(style: string): boolean {
  return style.startsWith('Object.assign') || (style.startsWith('{') && style.endsWith('}'));
}