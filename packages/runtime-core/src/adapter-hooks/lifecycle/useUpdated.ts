import { useEffect, useRef, type DependencyList } from 'react';
import { executeEffect } from '../shared/executeEffect';
import type { EffectCallback } from '../shared/types';

/**
 * Vue-like onUpdated (skip first mount).
 * @see https://vureact-runtime.vercel.app/guide/hooks/updated
 */
export function useUpdated(fn: EffectCallback, deps?: DependencyList): void {
  const isFirstMount = useRef(true);

  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }

    return executeEffect(fn);
  }, deps || []);
}
