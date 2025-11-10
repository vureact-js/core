import { type DependencyList, useEffect, useMemo, useRef } from 'react';
import { executeEffect } from '../executeEffect';
import type { Destructor, EffectCallback } from '../types';
import { createWatchStopHandle, type WatchStopHandle } from './useWatch';

export function useWatchEffect(fn: EffectCallback, deps?: DependencyList): WatchStopHandle {
  const { stop, onStop } = createWatchStopHandle();

  const cleanupRef = useRef<Destructor>(undefined);
  const newDeps = useMemo(() => [...(deps ?? []), stop], [deps, stop]);

  useEffect(() => {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, newDeps);

  return onStop;
}
