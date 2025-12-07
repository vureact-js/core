import { camelCase } from '../utils/camelCase';

export type StyleType = string | Record<string, any> | StyleType[] | null | undefined;

/**
 * vBindStyle - Runtime helper for the Vue `v-bind:style` directive in React JSX.
 *
 * @description
 *
 * 1. Flattens arrays (supports multi-level nesting)
 * 2. Parses string-based styles into objects
 * 3. Deep-merges all styles (later ones override earlier ones)
 *
 * @param target - The primary style source
 * @param merges - Additional style sources to merge
 * @returns A React-compatible style object
 */

export function vBindStyle(target: StyleType, ...merges: StyleType[]): object {
  const styles: Record<string, any> = {};
  const inputs = [target, ...merges];

  const processItem = (item: StyleType) => {
    if (!item) return;

    if (Array.isArray(item)) {
      // 递归处理数组
      item.forEach(processItem);
    } else if (typeof item === 'string') {
      // 解析字符串样式
      Object.assign(styles, parseCssText(item));
    } else if (typeof item === 'object') {
      // 直接合并对象
      Object.assign(styles, item);
    }
  };

  inputs.forEach(processItem);

  return styles;
}

/**
 * 将 CSS 文本字符串解析为对象
 * e.g., "font-size: 12px; display: none" -> { fontSize: '12px', display: 'none' }
 */
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
