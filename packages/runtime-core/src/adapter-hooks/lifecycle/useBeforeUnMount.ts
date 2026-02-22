import { useLayoutEffect } from 'react';
import type { EffectCallback } from '../shared/types';

/**
 * Vue-like onBeforeUnmount.
 * @see https://vureact-runtime.vercel.app/guide/hooks/before-unmount
 */
export function useBeforeUnMount(fn: EffectCallback): void {
  useLayoutEffect(
    () => () => {
      fn();
    },
    [],
  );
}
