import { useLayoutEffect } from 'react';
import { executeEffect } from '../shared/executeEffect';
import type { EffectCallback } from '../shared/types';

/**
 * Vue-like onBeforeMount (React approximation with useLayoutEffect).
 * @see https://runtime.vureact.top/guide/hooks/before-mount.html
 */
export function useBeforeMount(fn: EffectCallback): void {
  useLayoutEffect(() => executeEffect(fn), []);
}
