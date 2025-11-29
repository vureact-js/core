import { useLayoutEffect } from 'react';
import { EffectCallback } from '../types';

/**
 * Synchronously execute the cleanup function
 * after DOM changes and before browser painting.
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
