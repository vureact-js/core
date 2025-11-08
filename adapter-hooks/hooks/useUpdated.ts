import { useUpdateEffect } from 'react-use';
import type { EffectCallback } from '../types';

export function useUpdated(fn: EffectCallback) {
  useUpdateEffect(() => {
    fn();
  }, undefined);
}
