import { renderHook } from '@testing-library/react';
import { useBeforeMount } from '../lifecycle/useBeforeMount';

describe('useBeforeMount test suites', () => {
  it('should run once on mount.', () => {
    const callback = jest.fn();

    renderHook(() => {
      useBeforeMount(callback);
    });

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('should run returned cleanup on unmount.', () => {
    const cleanup = jest.fn();

    const { unmount } = renderHook(() => {
      useBeforeMount(() => cleanup);
    });

    expect(cleanup).not.toHaveBeenCalled();

    unmount();

    expect(cleanup).toHaveBeenCalledTimes(1);
  });
});
