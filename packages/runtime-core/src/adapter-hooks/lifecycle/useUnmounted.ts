import { useEffect } from 'react';
import type { EffectCallback } from '../shared/types';

/**
 * Vue-like onUnmounted.
 * @see https://vureact-runtime.vercel.app/guide/hooks/unmounted
 */
export function useUnmounted(fn: EffectCallback): void {
  useEffect(
    () => () => {
      fn();
    },
    [],
  );
}
