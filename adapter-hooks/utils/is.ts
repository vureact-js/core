import type { AsyncCallback } from '../types';

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
