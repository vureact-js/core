import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDeepCompareEffect, useFirstMountState, useUnmount } from 'react-use';
import { executeEffect } from '../executeEffect';
import type { Destructor } from '../types';

export type WatchSource<T = any> = T | (() => T);

export type WatchCallback<V = any, OV = any> = (value: V, oldValue: OV) => Destructor;

export interface WatchOptions {
  immediate?: boolean;
  deep?: boolean | number;
  once?: boolean;
}

export type WatchStopHandle = () => void;

export function useWatch<T>(
  source: WatchSource<T>,
  fn: WatchCallback<T>,
  options?: WatchOptions,
): WatchStopHandle {
  const { stop, onStop } = createWatchStopHandle();

  const isFirstMount = useFirstMountState();

  const callOnce = useRef(false);
  const prevDeps = useRef<T[]>([]);
  const currentDeps = useRef<T[]>([]);
  const cleanupRef = useRef<Destructor>(undefined);

  const handleSource = useCallback(() => {
    if (Array.isArray(source)) {
      currentDeps.current.length = 0;
      currentDeps.current.push(...source);
      return;
    }

    if (typeof source === 'function') {
      const returnVal = (source as () => T)();
      if (Array.isArray(returnVal)) {
        currentDeps.current.length = 0;
        currentDeps.current.push(...returnVal);
      } else {
        currentDeps.current.push(returnVal);
      }
      return;
    }

    currentDeps.current.push(source);
  }, [source]);

  handleSource();

  const effect = useMemo(() => (options?.deep ? useDeepCompareEffect : useEffect), [options?.deep]);

  effect(() => {
    if (stop) {
      cleanupRef.current?.();
      return;
    }

    if (callOnce.current) return;

    if (isFirstMount) {
      if (options?.immediate) {
        if (options?.once) callOnce.current = true;
        prevDeps.current = currentDeps.current;
        executeEffect(fn, (cleanup) => {
          cleanupRef.current = cleanup;
        });
      }
      return;
    }

    if (options?.once) callOnce.current = true;

    executeEffect(fn, (cleanup) => {
      cleanupRef.current = cleanup;
    });

    prevDeps.current = currentDeps.current;
  }, currentDeps.current);

  useUnmount(() => {
    if (!stop) cleanupRef.current?.();
  });

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
