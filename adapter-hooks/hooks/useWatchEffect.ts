import { type DependencyList, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { executeEffect } from '../shared/executeEffect';
import type { Destructor, EffectCallback } from '../types';
import { createWatchStopHandle, type WatchStopHandle } from './useWatch';

/**
 * `useWatchEffect` is similar to Vue's `watchEffect` and returns a stop function.
 */
export function useWatchEffect(fn: EffectCallback, deps?: DependencyList): WatchStopHandle {
  return handleEffect(fn, deps, 'post');
}

/**
 * `useWatchPostEffect` is similar to Vue's `watchPostEffect` and returns a stop function.
 */
export function useWatchPostEffect(fn: EffectCallback, deps?: DependencyList): WatchStopHandle {
  return handleEffect(fn, deps, 'post');
}

/**
 * `useWatchSyncEffect` is similar to Vue's `watchSyncEffect` and returns a stop function.
 */
export function useWatchSyncEffect(fn: EffectCallback, deps?: DependencyList): WatchStopHandle {
  return handleEffect(fn, deps, 'sync');
}

export function handleEffect(
  fn: EffectCallback,
  deps?: DependencyList,
  timing?: 'post' | 'sync',
): WatchStopHandle {
  const { stop, onStop } = createWatchStopHandle();

  const cleanupRef = useRef<Destructor>(undefined);

  const newDeps = useMemo(() => [...(deps ?? []), stop], [deps, stop]);
  const effect = useMemo(() => (timing === 'post' ? useEffect : useLayoutEffect), [timing]);

  effect(() => {
    if (stop) {
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = undefined;
      }
      return;
    }

    cleanupRef.current = executeEffect(fn, (cleanup) => {
      cleanupRef.current = cleanup;
    });

    return cleanupRef.current;
  }, newDeps);

  return onStop;
}
