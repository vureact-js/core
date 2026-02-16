import { useEffect } from 'react';
import type { EffectCallback } from '../shared/types';

/**
 * Vue-like onUnmounted.
 */
export function useUnmounted(fn: EffectCallback): void {
  useEffect(
    () => () => {
      fn();
    },
    [],
  );
}
