import { useLayoutEffect } from 'react';
import { executeEffect } from '../shared/executeEffect';
import type { EffectCallback } from '../shared/types';

/**
 * Vue-like onBeforeMount (React approximation with useLayoutEffect).
 * @see https://vureact-runtime.vercel.app/guide/hooks/before-mount
 */
export function useBeforeMount(fn: EffectCallback): void {
  useLayoutEffect(() => executeEffect(fn), []);
}
