import { useEffect } from 'react';
import type { EffectCallback } from '../shared/types';

/**
 * @see https://vureact-runtime.vercel.app/en/hooks/useUnmounted
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
