export type VBindClsInput = string | Record<string, any> | VBindClsInput[];

/**
 * vBindCls - Runtime helper for Vue v-bind:class directive in React JSX
 *
 * @param input - Supports string, object, array, and mixed types
 * @param merge - Supplementary items to be merged (optional)
 * @returns Final class name string with space-separated, deduplicated, and trimmed values
 *
 * @example
 * vBindCls('static')                                           // "static"
 * vBindCls({ active: isActive })                               // "active" or ""
 * vBindCls(['a', { b: flag }, 'c'])                            // "a b c" or "a c"
 * vBindCls('base', { active: isActive })                       // "base active" or "base"
 * vBindCls({ foo: true }, 'bar')                               // "foo bar"
 * vBindCls(['a', 'b'], ['c', { d: true }])                     // "a b c d"
 * 
 * @see https://vureact.vercel.app/en/adapter-utils/vBindCls
 */
export function vBindCls(input: VBindClsInput, merge?: VBindClsInput): string {
  const baseResult = processInput(input);
  if (merge === undefined) return baseResult;

  const mergedResult = processInput(merge);
  return mergeClassStrings(baseResult, mergedResult);
}

function processInput(input: VBindClsInput): string {
  if (input == null) return '';

  // 字符串 → 规范化
  if (typeof input === 'string') {
    return normalizeSpaces(input);
  }

  // 数组 → 特殊处理，跳过 falsy 值
  if (Array.isArray(input)) {
    const parts: string[] = [];

    for (const item of input) {
      // 跳过 false, null, undefined（但保留空字符串和对象）
      if (item === false || item == null) continue;

      const processed = processInput(item);
      if (processed) parts.push(processed);
    }

    return parts.join(' ');
  }

  // 对象 → 处理函数条件
  if (typeof input === 'object') {
    const parts: string[] = [];

    for (const [key, condition] of Object.entries(input)) {
      // 展开运算符
      if (key.startsWith('...')) {
        const processed = processInput((input as any)[key]);
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
  if (typeof input === 'boolean') return '';

  return normalizeSpaces(String(input));
}

function mergeClassStrings(base: string, merge: string): string {
  if (!base) return merge;
  if (!merge) return base;

  const baseClasses = normalizeSpaces(base).split(' ');
  const additionalClasses = normalizeSpaces(merge).split(' ');

  // 去重并保持顺序
  const merged = new Set([...baseClasses, ...additionalClasses]);

  return Array.from(merged).join(' ');
}

function normalizeSpaces(str: string): string {
  // 将连续空格转为单个空格
  return str.trim().split(/\s+/).filter(Boolean).join(' ');
}
