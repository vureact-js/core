import { renderHook, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { useMounted } from '../lifecycle/useMounted';

const mockFetchData = jest.fn((): Promise<string> => {
  return new Promise((res) => {
    setTimeout(() => {
      res('initial data');
    }, 2000);
  });
});

const mockApi = {
  fetchData: mockFetchData,
};

describe('useMounted test suites', () => {
  // 在每次测试前启用假计时器，以控制 setTimeout
  beforeEach(() => {
    jest.useFakeTimers();
    mockFetchData.mockClear(); // 每次测试前清空 Mock 调用的历史记录
  });

  // 1. 测试首次挂载 (同步)
  it('After the first mount, the state should be true.', () => {
    const { result } = renderHook(() => {
      const [state, setState] = useState(false);

      useMounted(() => {
        setState(true);
      });

      return state;
    });

    expect(result.current).toBe(true);
  });

  // 2. 验证调用次数 (Mount 阶段)
  it('The data fetching function should be called exactly once upon the first mount.', () => {
    renderHook(() => {
      useMounted(() => {
        mockApi.fetchData();
      });
    });

    // 立即断言：useMounted 回调应在挂载后立即同步调用 fetchData
    expect(mockApi.fetchData).toHaveBeenCalledTimes(1);
  });

  // 3. 验证数据更新 (异步)
  it('The data should be updated after the asynchronous call completes.', async () => {
    const { result } = renderHook(() => {
      const [data, setData] = useState('no data'); // 初始值

      useMounted(async () => {
        const str = await mockApi.fetchData();
        setData(str);
      });

      return data;
    });

    // 确保 fetchData 被调用了一次
    expect(mockApi.fetchData).toHaveBeenCalledTimes(1);

    // 快进时间，让 Promise 解决
    jest.advanceTimersByTime(2000);

    await waitFor(() => {
      expect(result.current).toBe('initial data');
    });
  });

  // 测试后恢复真实计时器
  afterEach(() => {
    jest.useRealTimers();
  });
});
