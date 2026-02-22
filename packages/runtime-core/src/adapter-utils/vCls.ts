export type ClsInputValue = string | Record<string, any> | ClsInputValue[];

/**
 * vCls - Runtime helper for Vue v-bind:class directive in React JSX
 *
 * @see https://vureact-runtime.vercel.app/guide/utils/v-cls
 *
 * @param {ClsInputValue} value - Supports string, object, array, and mixed types
 * @param {ClsInputValue} mergeItem - Supplementary items to be merged (optional)
 * @returns Final class name string with space-separated, deduplicated, and trimmed values
 *
 * @example
 * vCls('static')                                           // "static"
 * vCls({ active: isActive })                               // "active" or ""
 * vCls(['a', { b: flag }, 'c'])                            // "a b c" or "a c"
 * vCls('base', { active: isActive })                       // "base active" or "base"
 * vCls({ foo: true }, 'bar')                               // "foo bar"
 * vCls(['a', 'b'], ['c', { d: true }])                     // "a b c d"
 */
export function vCls(value: ClsInputValue, mergeItem?: ClsInputValue): string {
  const baseResult = processInput(value);
  if (mergeItem === undefined) return baseResult;

  const mergedResult = processInput(mergeItem);
  return mergeClassStrings(baseResult, mergedResult);
}

function processInput(value: ClsInputValue): string {
  if (value == null) return '';

  // 字符串 → 规范化
  if (typeof value === 'string') {
    return normalizeSpaces(value);
  }

  // 数组 → 特殊处理，跳过 falsy 值
  if (Array.isArray(value)) {
    const parts: string[] = [];

    for (const item of value) {
      // 跳过 false, null, undefined（但保留空字符串和对象）
      if (item === false || item == null) continue;

      const processed = processInput(item);
      if (processed) parts.push(processed);
    }

    return parts.join(' ');
  }

  // 对象 → 处理函数条件
  if (typeof value === 'object') {
    const parts: string[] = [];

    for (const [key, condition] of Object.entries(value)) {
      // 展开运算符
      if (key.startsWith('...')) {
        const processed = processInput((value as any)[key]);
        if (processed) parts.push(processed);
        continue;
      }

      // 函数求值
      const actualCondition = typeof condition === 'function' ? condition() : condition;

      if (actualCondition) {
        parts.push(normalizeSpaces(key));
      }
    }

    return parts.join(' ');
  }

  // 其他类型（number, boolean等）
  if (typeof value === 'boolean') return '';

  return normalizeSpaces(String(value));
}

function mergeClassStrings(base: string, mergeItem: string): string {
  if (!base) return mergeItem;
  if (!mergeItem) return base;

  const baseClasses = normalizeSpaces(base).split(' ');
  const additionalClasses = normalizeSpaces(mergeItem).split(' ');

  // 去重并保持顺序
  const merged = new Set([...baseClasses, ...additionalClasses]);

  return Array.from(merged).join(' ');
}

function normalizeSpaces(str: string): string {
  // 将连续空格转为单个空格
  return str.trim().split(/\s+/).filter(Boolean).join(' ');
}
