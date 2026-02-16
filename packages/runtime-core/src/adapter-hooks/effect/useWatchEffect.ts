import { type DependencyList, useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import { executeEffect } from '../shared/executeEffect';
import type { Destructor, EffectCallback, FlushTiming, OnCleanup } from '../shared/types';
import type { WatchStopHandle } from './useWatch';

export interface WatchEffectOptions {
  flush?: FlushTiming;
}

/**
 * Vue-like watchEffect adapter with manual React dependency control.
 */
export function useWatchEffect(
  fn: EffectCallback,
  deps?: DependencyList,
  options?: WatchEffectOptions,
): WatchStopHandle {
  return handleEffect(fn, deps, { flush: 'pre', ...options });
}

export function useWatchPostEffect(fn: EffectCallback, deps?: DependencyList): WatchStopHandle {
  return handleEffect(fn, deps, { flush: 'post' });
}

export function useWatchSyncEffect(fn: EffectCallback, deps?: DependencyList): WatchStopHandle {
  return handleEffect(fn, deps, { flush: 'sync' });
}

export function handleEffect(
  fn: EffectCallback,
  deps?: DependencyList,
  options?: WatchEffectOptions,
): WatchStopHandle {
  const callbackRef = useRef(fn);
  callbackRef.current = fn;

  const cleanupRef = useRef<Destructor>(undefined);
  const stoppedRef = useRef(false);

  const flush = options?.flush ?? 'pre';

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

  const effectDeps = deps ? [...deps, flush] : undefined;

  useFlushEffect(
    flush,
    () => {
      if (stoppedRef.current) {
        return;
      }

      runCleanup();

      const registerCleanup: OnCleanup = (cleanup) => {
        cleanupRef.current = cleanup;
      };

      cleanupRef.current = executeEffect(
        (onCleanup?: OnCleanup) => callbackRef.current(onCleanup),
        registerCleanup,
      );

      return runCleanup;
    },
    effectDeps,
  );

  return onStop;
}

function resolveFlushEffectHook(flush: FlushTiming): 'effect' | 'layout' {
  return flush === 'post' ? 'effect' : 'layout';
}

function useFlushEffect(
  flush: FlushTiming,
  effectFn: () => Destructor,
  deps?: DependencyList,
): void {
  const hookType = resolveFlushEffectHook(flush);

  useLayoutEffect(() => {
    if (hookType !== 'layout') {
      return;
    }

    return effectFn();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    if (hookType !== 'effect') {
      return;
    }

    return effectFn();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
