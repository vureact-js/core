import { type DependencyList, RefObject, useCallback, useRef } from 'react';
import isEqual from 'react-fast-compare';
import { executeEffect } from '../shared/executeEffect';
import type { Destructor, FlushTiming, OnCleanup } from '../shared/types';
import { unwrapRef } from '../state/useVRef';
import { useFlushEffect } from './shared';

export type WatchSource<T = any> = T | (() => T);

export type WatchCallback<V = any, OV = any> = (
  value: V,
  oldValue: OV | undefined,
  onCleanup?: OnCleanup,
) => Destructor | Promise<Destructor>;

export interface WatchOptions {
  immediate?: boolean;
  deep?: boolean | number;
  once?: boolean;
  flush?: FlushTiming;
}

export type WatchStopHandle = () => void;

type ResolvedWatchSource<T> = {
  value: T;
  deps: DependencyList;
  isMultiSource: boolean;
};

/**
 * React adapter for Vue's watch API (manual dependencies mode).
 * @see https://vureact-runtime.vercel.app/guide/hooks/watch
 */
export function useWatch<T>(
  source: WatchSource<T>,
  fn: WatchCallback<T, T>,
  options?: WatchOptions,
): WatchStopHandle {
  const callbackRef = useRef(fn);
  callbackRef.current = fn;

  const cleanupRef = useRef<Destructor>(undefined);
  const currentValueRef = useRef<T | undefined>(undefined);
  const initializedRef = useRef(false);
  const onceTriggeredRef = useRef(false);
  const stoppedRef = useRef(false);

  const flush = options?.flush ?? 'pre';
  const resolvedSource = resolveWatchDeps(source);

  const runCleanup = useCallback(() => {
    if (typeof cleanupRef.current !== 'function') {
      cleanupRef.current = undefined;
      return;
    }

    const cleanup = cleanupRef.current;
    cleanupRef.current = undefined;
    cleanup();
  }, []);

  const onStop = useCallback(() => {
    if (stoppedRef.current) {
      return;
    }

    stoppedRef.current = true;
    runCleanup();
  }, [runCleanup]);

  const watchDeps: DependencyList = [
    ...resolvedSource.deps,
    options?.immediate,
    options?.deep,
    options?.once,
    flush,
  ];

  useFlushEffect(
    flush,
    () => {
      if (stoppedRef.current) {
        return;
      }

      const nextValue = snapshotWatchValue(resolvedSource.value, resolvedSource.isMultiSource);

      if (!initializedRef.current) {
        initializedRef.current = true;

        if (options?.immediate) {
          runAndRegisterCleanup(callbackRef.current, nextValue, undefined, cleanupRef, runCleanup);

          if (options?.once) {
            onceTriggeredRef.current = true;
            onStop();
            return;
          }
        }

        currentValueRef.current = nextValue;
        return;
      }

      if (onceTriggeredRef.current) {
        return;
      }

      const previousValue = currentValueRef.current;
      const changed = hasWatchValueChanged(
        nextValue,
        previousValue,
        options?.deep,
        resolvedSource.isMultiSource,
      );

      if (!changed) {
        return;
      }

      runAndRegisterCleanup(callbackRef.current, nextValue, previousValue, cleanupRef, runCleanup);

      currentValueRef.current = nextValue;

      if (options?.once) {
        onceTriggeredRef.current = true;
        onStop();
      }
    },
    watchDeps,
  );

  return onStop;
}

function runAndRegisterCleanup<T>(
  callback: WatchCallback<T, T>,
  value: T,
  oldValue: T | undefined,
  cleanupRef: RefObject<Destructor>,
  runCleanup: () => void,
) {
  runCleanup();

  const registerCleanup: OnCleanup = (cleanup) => {
    cleanupRef.current = cleanup;
  };

  cleanupRef.current = executeEffect(
    (onCleanup?: OnCleanup) => callback(value, oldValue, onCleanup),
    registerCleanup,
  );
}

function resolveWatchDeps<T>(source: WatchSource<T>): ResolvedWatchSource<T> {
  if (typeof source === 'function') {
    const value = unwrapRef<any>((source as () => T)()) as T;
    return {
      value,
      deps: [value],
      isMultiSource: false,
    };
  }

  if (Array.isArray(source)) {
    const value = source.map(unwrapRef) as T;
    return {
      value,
      deps: value as DependencyList,
      isMultiSource: true,
    };
  }

  const value = unwrapRef(source as any) as T;
  return {
    value,
    deps: [value],
    isMultiSource: false,
  };
}

function snapshotWatchValue<T>(value: T, isMultiSource: boolean): T {
  if (isMultiSource && Array.isArray(value)) {
    return [...value] as T;
  }

  return value;
}

function hasWatchValueChanged(
  nextValue: unknown,
  previousValue: unknown,
  deep?: boolean | number,
  isMultiSource = false,
): boolean {
  if (isMultiSource && Array.isArray(nextValue) && Array.isArray(previousValue)) {
    if (nextValue.length !== previousValue.length) {
      return true;
    }

    for (let i = 0; i < nextValue.length; i++) {
      if (!isWatchValueEqual(nextValue[i], previousValue[i], deep)) {
        return true;
      }
    }

    return false;
  }

  return !isWatchValueEqual(nextValue, previousValue, deep);
}

function isWatchValueEqual(a: unknown, b: unknown, deep?: boolean | number): boolean {
  if (!deep) {
    return Object.is(a, b);
  }

  if (deep === true) {
    return isEqual(a, b);
  }

  return isEqualByDepth(a, b, deep);
}

function isEqualByDepth(a: unknown, b: unknown, maxDepth: number): boolean {
  return isEqualByDepthInternal(a, b, maxDepth, new WeakMap<object, WeakSet<object>>());
}

function isEqualByDepthInternal(
  a: unknown,
  b: unknown,
  depth: number,
  seenPairs: WeakMap<object, WeakSet<object>>,
): boolean {
  if (Object.is(a, b)) {
    return true;
  }

  if (depth <= 0) {
    return false;
  }

  if (a == null || b == null || typeof a !== 'object' || typeof b !== 'object') {
    return false;
  }

  if (hasSeenPair(a, b, seenPairs)) {
    return true;
  }
  markSeenPair(a, b, seenPairs);

  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) {
      return false;
    }

    for (let i = 0; i < a.length; i++) {
      if (!isEqualByDepthInternal(a[i], b[i], depth - 1, seenPairs)) {
        return false;
      }
    }

    return true;
  }

  if (a instanceof Date || b instanceof Date) {
    return a instanceof Date && b instanceof Date && a.getTime() === b.getTime();
  }

  if (a instanceof RegExp || b instanceof RegExp) {
    return a instanceof RegExp && b instanceof RegExp && a.toString() === b.toString();
  }

  if (a instanceof Map || b instanceof Map || a instanceof Set || b instanceof Set) {
    return isEqual(a, b);
  }

  if (Object.getPrototypeOf(a) !== Object.getPrototypeOf(b)) {
    return false;
  }

  const keysA = Object.keys(a as Record<string, unknown>);
  const keysB = Object.keys(b as Record<string, unknown>);

  if (keysA.length !== keysB.length) {
    return false;
  }

  for (const key of keysA) {
    if (!(key in (b as Record<string, unknown>))) {
      return false;
    }

    if (
      !isEqualByDepthInternal(
        (a as Record<string, unknown>)[key],
        (b as Record<string, unknown>)[key],
        depth - 1,
        seenPairs,
      )
    ) {
      return false;
    }
  }

  return true;
}

function hasSeenPair(a: object, b: object, seenPairs: WeakMap<object, WeakSet<object>>): boolean {
  const seenSet = seenPairs.get(a);
  return !!seenSet?.has(b);
}

function markSeenPair(a: object, b: object, seenPairs: WeakMap<object, WeakSet<object>>): void {
  let seenSet = seenPairs.get(a);

  if (!seenSet) {
    seenSet = new WeakSet<object>();
    seenPairs.set(a, seenSet);
  }

  seenSet.add(b);
}
