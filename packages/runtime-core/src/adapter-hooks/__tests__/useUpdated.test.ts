import { renderHook } from '@testing-library/react';
import { useUpdated } from '../lifecycle/useUpdated';

describe('useUpdated test suites', () => {
  const mockCallback = jest.fn();

  beforeEach(() => {
    mockCallback.mockClear();
  });

  it('should NOT run the effect callback upon initial mount.', () => {
    renderHook(() => {
      useUpdated(mockCallback);
    });

    // 初始挂载时不执行
    expect(mockCallback).not.toHaveBeenCalled();
  });
});
