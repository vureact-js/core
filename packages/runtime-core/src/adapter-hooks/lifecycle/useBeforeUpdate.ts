import { useLayoutEffect, useRef, type DependencyList } from 'react';
import { executeEffect } from '../shared/executeEffect';
import type { EffectCallback } from '../shared/types';

/**
 * Vue-like onBeforeUpdate (skip first mount).
 */
export function useBeforeUpdate(fn: EffectCallback, deps?: DependencyList): void {
  const isFirstMount = useRef(true);

  useLayoutEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }

    return executeEffect(fn);
  }, deps || []);
}
