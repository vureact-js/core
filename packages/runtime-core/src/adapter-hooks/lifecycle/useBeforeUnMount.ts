import { useLayoutEffect } from 'react';
import type { EffectCallback } from '../shared/types';

/**
 * Vue-like onBeforeUnmount.
 * @see https://runtime.vureact.top/guide/hooks/before-unmount.html
 */
export function useBeforeUnMount(fn: EffectCallback): void {
  useLayoutEffect(
    () => () => {
      fn();
    },
    [],
  );
}
