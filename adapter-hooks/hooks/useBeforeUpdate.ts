import type { DependencyList, EffectCallback } from 'react';
import { useLayoutEffect } from 'react';
import { useIsFirstMount } from './useIsFirstMount';

/**
 * Called after DOM update and before browser painting,
 * logically simulating the "pre-update" phase.
 */
export function useBeforeUpdate(fn: EffectCallback, deps: DependencyList): void {
  const firstMount = useIsFirstMount();

  useLayoutEffect(() => {
    if (firstMount) {
      return;
    }

    fn();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
