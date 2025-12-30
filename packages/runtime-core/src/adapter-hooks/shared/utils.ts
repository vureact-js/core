import type { AsyncCallback } from './types';

export function isAsyncFunc(fn: any): fn is AsyncCallback {
  if (typeof fn !== 'function') {
    return false;
  }

  return (
    fn[Symbol.toStringTag] === 'AsyncFunction' ||
    Object.prototype.toString.call(fn) === '[object AsyncFunction]' ||
    fn.constructor.name === 'AsyncFunction' ||
    isPromise(fn())
  );
}

export function isPromise(obj: any): obj is Promise<any> {
  return (
    !!obj &&
    (typeof obj === 'object' || typeof obj === 'function') &&
    typeof obj.then === 'function'
  );
}

export function isObject(value: any): value is object {
  return value !== null && typeof value === 'object';
}

export function isPrimitive(value: unknown): boolean {
  return value === null || (typeof value !== 'object' && typeof value !== 'function');
}

export const isMapSetArray = (value: any): boolean =>
  Array.isArray(value) || value instanceof Map || value instanceof Set;

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
