import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDeepCompareEffect, useFirstMountState, useUnmount } from 'react-use';
import { executeEffect } from '../shared/executeEffect';
import type { Destructor } from '../types';
import { isPrimitive } from '../utils';

export type WatchSource<T = any> = T | (() => T);

export type WatchCallback<V = any, OV = any> = (value: V, oldValue: OV) => Destructor;

export interface WatchOptions {
  immediate?: boolean;
  deep?: boolean | number;
  once?: boolean;
}

export type WatchStopHandle = () => void;

/**
 * `useWatch` is almost identical to Vue's `watch` in terms of usage.
 * @param source Listen for dependencies, whether single, multiple, or the return value of a function.
 * @param fn A effect that executes when dependencies change.
 * @param options The provided options include `immediate`, `deep`, and `once`.
 * @returns
 */
export function useWatch<T>(
  source: WatchSource<T>,
  fn: WatchCallback<T, T>,
  options?: WatchOptions,
): WatchStopHandle {
  const { stop, onStop } = createWatchStopHandle();

  const isFirstMount = useFirstMountState();

  const once = useRef(false);
  const oldValue = useRef<T>(undefined);
  const newValue = useRef<T>(undefined);
  const cleanupRef = useRef<Destructor>(undefined);

  const getDepsFromSource = (src: WatchSource<T>): any[] => {
    if (typeof src === 'function') {
      const result = (src as () => T)();
      newValue.current = result;

      // 函数返回值总是作为单个依赖项
      return [result];
    }

    newValue.current = src;

    // 非函数值：如果是数组，可能是多依赖；否则是单依赖
    return Array.isArray(src) ? src : [src];
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const sourceDeps = useMemo(() => getDepsFromSource(source), [source]);
  const deps = useMemo(() => [...sourceDeps, stop], [sourceDeps, stop]);

  const effect = useMemo(() => {
    if (!options?.deep) return useEffect;

    // 依赖项包含非原始值时使用深度比较
    const hasNonPrimitive = sourceDeps.some((dep) => !isPrimitive(dep));
    return hasNonPrimitive ? useDeepCompareEffect : useEffect;
  }, [options?.deep, sourceDeps]);

  const runCleanup = () => {
    if (!cleanupRef.current) return;
    cleanupRef.current();
    cleanupRef.current = undefined;
  };

  effect(() => {
    const updateValue = () => {
      oldValue.current = newValue.current;
    };

    const triggerFn = () => {
      runCleanup();
      cleanupRef.current = executeEffect(
        () => fn(newValue.current!, oldValue.current!),
        (asyncCleanup) => {
          cleanupRef.current = asyncCleanup;
        },
      );
    };

    if (stop) {
      runCleanup();
      return;
    }

    if (isFirstMount) {
      updateValue();
      if (options?.immediate) {
        if (options?.once) {
          once.current = true;
        }
        triggerFn();
      }
      return;
    }

    if (once.current) return;
    once.current = !!options?.once;

    triggerFn();
    updateValue();
  }, deps);

  useUnmount(runCleanup);

  return onStop;
}

export function createWatchStopHandle() {
  const [stop, setStop] = useState(false);
  const onStop = useCallback(() => {
    setStop(true);
  }, []);
  return {
    stop,
    onStop,
  };
}
