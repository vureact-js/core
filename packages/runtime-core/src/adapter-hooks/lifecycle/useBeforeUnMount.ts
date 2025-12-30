import { useLayoutEffect } from 'react';
import { EffectCallback } from '../shared/types';

/**
 * Synchronously execute the cleanup function
 * after DOM changes and before browser painting.
 *
 * @see https://react-vue3-hooks.vercel.app/en/hooks/useBeforeUnMount
 */
export function useBeforeUnMount(fn: EffectCallback) {
  useLayoutEffect(
    () => () => {
      fn();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
}
