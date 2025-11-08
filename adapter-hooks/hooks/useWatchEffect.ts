import { type DependencyList, useEffect, useRef } from 'react';
import { executeEffect } from '../executeEffect';
import type { Destructor, EffectCallback } from '../types';
import { createWatchStopHandle, type WatchStopHandle } from './useWatch';

export function useWatchEffect(fn: EffectCallback, deps?: DependencyList): WatchStopHandle {
  const { stop, onStop } = createWatchStopHandle();
  const cleanupRef = useRef<Destructor>(undefined);

  useEffect(() => {
    if (stop) {
      cleanupRef.current?.();
      return;
    }

    executeEffect(fn, (cleanup) => {
      cleanupRef.current = cleanup;
    });

    return cleanupRef.current;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return onStop;
}
