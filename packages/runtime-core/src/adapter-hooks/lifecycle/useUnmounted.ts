import { useEffect } from 'react';
import type { EffectCallback } from '../shared/types';

/**
 * Vue-like onUnmounted.
 * @see https://runtime.vureact.top/guide/hooks/unmounted.html
 */
export function useUnmounted(fn: EffectCallback): void {
  useEffect(
    () => () => {
      fn();
    },
    [],
  );
}
