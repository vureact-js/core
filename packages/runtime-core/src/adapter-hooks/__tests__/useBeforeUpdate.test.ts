import { act, renderHook } from '@testing-library/react';
import { useState } from 'react';
import { useBeforeUpdate } from '../lifecycle/useBeforeUpdate';

describe('useBeforeUpdate test suites', () => {
  it('should skip first mount and run before updates.', () => {
    const callback = jest.fn();
    let setCount: (n: number) => void = () => {};

    renderHook(() => {
      const [count, setLocalCount] = useState(0);
      setCount = setLocalCount;

      useBeforeUpdate(callback, [count]);
    });

    expect(callback).not.toHaveBeenCalled();

    act(() => {
      setCount(1);
    });

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('should run returned cleanup before next update and on unmount.', () => {
    const cleanup = jest.fn();
    let setCount: (n: number) => void = () => {};

    const { unmount } = renderHook(() => {
      const [count, setLocalCount] = useState(0);
      setCount = setLocalCount;

      useBeforeUpdate(() => cleanup, [count]);
    });

    act(() => {
      setCount(1);
    });

    expect(cleanup).not.toHaveBeenCalled();

    act(() => {
      setCount(2);
    });

    expect(cleanup).toHaveBeenCalledTimes(1);

    unmount();

    expect(cleanup).toHaveBeenCalledTimes(2);
  });
});
