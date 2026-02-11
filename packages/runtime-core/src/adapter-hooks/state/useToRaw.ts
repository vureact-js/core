import { RAW_TARGET } from '../shared/consts';
import { isProxy } from '../shared/proxy';
import { isPrimitive } from '../shared/utils';

/**
 * Returns the raw (non-proxied) version of a reactive object if available.
 *
 * If the provided `target` is not a proxy or is a primitive, attempts to access its raw target via the `RAW_TARGET` symbol.
 * Otherwise, returns the raw target if present, or the original target.
 *
 * @example
 *
 * const source = { count: 1 };
 * const proxy = useReactive(source);
 * const raw = useToRaw(proxy);
 * // raw and source are strictly equal.
 *
 * @param target - The object to retrieve the raw version from.
 * @returns The raw object if available, otherwise `undefined` or the original target.
 */
export function useToRaw<T extends object>(target: T): T | undefined {
  if (!isProxy(target) || isPrimitive(target)) {
    return (target as any)?.[RAW_TARGET];
  }

  return (target as any)[RAW_TARGET] || target;
}
