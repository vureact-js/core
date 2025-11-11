import { useUpdateEffect } from 'react-use';
import type { EffectCallback } from '../types';

/**
 * `useUpdated` does not execute on initial mount and will be triggered
 * on any update of the component, with no dependencies required.
 */
export function useUpdated(fn: EffectCallback) {
  useUpdateEffect(() => {
    fn();
  }, undefined);
}
