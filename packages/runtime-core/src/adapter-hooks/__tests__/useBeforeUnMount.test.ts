import { renderHook } from '@testing-library/react';
import { useBeforeUnMount } from '../lifecycle/useBeforeUnMount';

describe('useBeforeUnMount test suites', () => {
  it('should run callback only on unmount.', () => {
    const callback = jest.fn();

    const { unmount } = renderHook(() => {
      useBeforeUnMount(callback);
    });

    expect(callback).not.toHaveBeenCalled();

    unmount();

    expect(callback).toHaveBeenCalledTimes(1);
  });
});
