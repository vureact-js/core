import { camelCase } from './shared';

export type VStyleItem = string | Record<string, any> | VStyleItem[] | null | undefined;

/**
 * vStyle - Runtime helper for the Vue `v-bind:style` directive in React JSX.
 *
 * @see https://runtime.vureact.top/guide/utils/v-style.html
 *
 * @remark
 * - Flattens arrays (supports multi-level nesting)
 * - Parses string-based styles into objects
 * - Deep-merges all styles (later ones override earlier ones)
 *
 * @param {VStyleItem} target - The primary style source
 * @param {Array<VStyleItem>} mergeItems - Additional style sources to merge
 * @returns A React-compatible style object
 */

export function vStyle(target: VStyleItem, ...mergeItems: VStyleItem[]): object {
  const styles: Record<string, any> = {};
  const inputs = [target, ...mergeItems];

  const processItem = (item: VStyleItem) => {
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
