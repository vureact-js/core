import { RAW_OBJ_KEY } from './consts';

/**
 * `toRaw()` can return the original object from proxies created by
 * `useReactive`, `useReadonly`, `useShallowReactive` or `useShallowReadonly`.
 */
export function toRaw<T>(proxyObject: T): T {
  return (proxyObject as any)[RAW_OBJ_KEY];
}
