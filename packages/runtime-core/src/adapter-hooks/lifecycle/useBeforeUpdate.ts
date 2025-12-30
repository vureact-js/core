import type { DependencyList, EffectCallback } from 'react';
import { useLayoutEffect } from 'react';
import { useIsFirstMount } from '../shared/useIsFirstMount';

/**
 * Called after DOM update and before browser painting,
 * logically simulating the "pre-update" phase.
 *
 * @see https://react-vue3-hooks.vercel.app/en/hooks/useBeforeUpdate
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
