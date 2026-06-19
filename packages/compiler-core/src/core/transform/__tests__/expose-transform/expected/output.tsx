import { forwardRef, useImperativeHandle, useCallback, memo } from 'react';
import { useVRef } from '@vureact/runtime-core';
export type ICompProps = {
  title?: string;
  initialCount?: number;
};
const Input = memo(forwardRef<any, ICompProps>((props, expose) => {
  const count = useVRef(props.initialCount || 0);
  const increment = useCallback(() => count.value++, [count.value]);
  const reset = useCallback(() => count.value = 0, [count.value]);
  useImperativeHandle(expose, () => ({
    count,
    increment,
    reset
  }));
  return null;
}));
export default Input;