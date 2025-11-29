/**
 * vBind - Runtime helper for Vue v-bind directive in React JSX
 *
 * @param keyOrObj - Static key, object, or null for dynamic key
 * @param value - Value to bind (for static/dynamic key syntax)
 * @param dynamicKey - Dynamic attribute name (when first arg is null)
 * @returns Object that can be spread as JSX props
 *
 * @example
 * // Static: :class="foo" → vBind('class', foo)
 * // Dynamic: :[key]="foo" → vBind(key, foo)
 * // Object: v-bind="{ foo, bar }" → vBind({ foo, bar })
 */

export function vBind(
  keyOrObj: string | Record<string, any> | null,
  value?: any,
): Record<string, any> {
  if (keyOrObj === null) return {};

  // 处理对象语法 v-bind="{ id: foo, 'data-bar': bar }"
  if (typeof keyOrObj === 'object') {
    return { ...keyOrObj };
  }

  // 处理静态键名 :key="value" 或 :[key]="value"
  return { [keyOrObj]: value };
}
