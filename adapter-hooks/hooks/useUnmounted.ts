import { useEffect } from 'react';
import type { EffectCallback } from '../types';

/**
 * @see https://react-vue3-hooks.vercel.app/en/hooks/useUnmounted
 */
export function useUnmounted(fn: EffectCallback) {
  useEffect(
    () => () => {
      fn();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
}
