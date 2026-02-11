import { freeze } from 'freeze-mutate';
import { klona } from 'klona';
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

export function isPrimitive(value: unknown): boolean {
  return value === null || (typeof value !== 'object' && typeof value !== 'function');
}

export function freezeObject<T extends object>(
  target: T,
  options: { deep?: boolean; clone?: boolean } = {},
): Readonly<T> {
  const { clone = true, deep = true } = options;
  const cloned = clone ? klona(target) : target;

  return freeze(cloned, deep);
}
