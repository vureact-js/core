import { DependencyList, useEffect, useRef } from 'react';
import isEqual from 'react-fast-compare';
import { EffectCallback } from './types';

/**
 * @private
 */
export function useDeepEffect(fn: EffectCallback, deps: DependencyList) {
  const lastDeps = useRef<DependencyList>([]);

  if (!lastDeps.current || !isEqual(lastDeps.current, deps)) {
    lastDeps.current = deps;
  }

  useEffect(() => {
    const cleanup = fn();
    return () => {
      if (typeof cleanup === 'function') {
        cleanup();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, lastDeps.current);
}
