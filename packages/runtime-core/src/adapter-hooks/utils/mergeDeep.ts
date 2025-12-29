import { isPrimitive } from './is';

/**
 * 轻量级深层合并函数，专门用于在 Immer draft 上操作
 * 只处理普通对象，避免处理复杂实例
 */
export function mergeDeep(target: any, source: any) {
  if (isPrimitive(source) || Array.isArray(source)) return source;

  Object.keys(source).forEach((key) => {
    const targetValue = target[key];
    const sourceValue = source[key];

    if (
      sourceValue &&
      typeof sourceValue === 'object' &&
      !Array.isArray(sourceValue) &&
      !isPrimitive(sourceValue)
    ) {
      // 如果目标不存在该属性，先初始化为空对象
      if (!targetValue) {
        target[key] = {};
      }
      mergeDeep(target[key], sourceValue);
    } else {
      target[key] = sourceValue;
    }
  });
}
