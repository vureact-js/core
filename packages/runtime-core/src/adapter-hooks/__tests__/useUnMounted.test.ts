import { renderHook, waitFor } from '@testing-library/react';
import { useUnmounted } from '../lifecycle/useUnmounted';

const mockFetchData = jest.fn((): Promise<string> => {
  return new Promise((res) => {
    setTimeout(() => {
      res('unmounted');
    }, 2000);
  });
});

const mockApi = {
  fetchData: mockFetchData,
};

describe('useUnMounted test suites', () => {
  // 在每次测试前启用假计时器，以控制 setTimeout
  beforeEach(() => {
    jest.useFakeTimers();
    mockFetchData.mockClear(); // 每次测试前清空 Mock 调用的历史记录
  });

  it('after unmount, the state should be false.', () => {
    let isMounted = true;

    const { unmount } = renderHook(() => {
      useUnmounted(() => {
        isMounted = false;
      });
    });

    expect(isMounted).toBe(true);

    unmount();

    expect(isMounted).toBe(false);
  });

  // 2. 验证调用次数
  it('The data fetching function should be called exactly once upon the unmount.', () => {
    const { unmount } = renderHook(() => {
      useUnmounted(() => {
        mockApi.fetchData();
      });
    });
    expect(mockApi.fetchData).not.toHaveBeenCalled();

    unmount();

    expect(mockApi.fetchData).toHaveBeenCalledTimes(1);
  });

  // 3. 验证数据更新 (异步)
  it('The data should be updated after the asynchronous call completes.', async () => {
    let data = '';

    const { unmount } = renderHook(() => {
      useUnmounted(async () => {
        data = await mockApi.fetchData();
      });
    });

    unmount();

    expect(mockApi.fetchData).toHaveBeenCalledTimes(1);

    // 快进时间，让 Promise 解决
    jest.advanceTimersByTime(2000);

    await waitFor(() => {
      expect(data).toBe('unmounted');
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });
});
