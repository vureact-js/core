import { useLayoutEffect } from 'react';
import type { EffectCallback } from '../shared/types';

/**
 * Vue-like onBeforeUnmount.
 */
export function useBeforeUnMount(fn: EffectCallback): void {
  useLayoutEffect(
    () => () => {
      fn();
    },
    [],
  );
}
