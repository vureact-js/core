import { freeze } from 'freeze-mutate';
import { WrapRef } from 'index';
import { klona } from 'klona';
import { getVersion } from 'valtio/vanilla';
import { PROXY_FLAG_KEY, PROXY_FLAG_VALUE } from './consts';
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

export function isProxy(target: unknown): boolean {
  return !isPrimitive(target) && getVersion(target) !== undefined;
}

// @ts-ignore
export function isRefState<T>(value: T): value is WrapRef<T> {
  return (value as any)[PROXY_FLAG_KEY] === PROXY_FLAG_VALUE.ref;
}

export function setProxyMeta(object: object, data: Record<string, any>) {
  for (const key in data) {
    (object as any)[key] = data[key];
  }
}

export function freezeObject<T extends object>(
  target: T,
  options: { deep?: boolean; clone?: boolean } = {},
): Readonly<T> {
  const { clone = true, deep = true } = options;
  const cloned = clone ? klona(target) : target;

  return freeze(cloned, deep);
}
