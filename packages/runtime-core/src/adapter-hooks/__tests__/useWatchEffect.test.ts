import { act, renderHook, waitFor } from '@testing-library/react';
import { useEffect, useRef, useState } from 'react';
import { useWatchEffect } from '../effect/useWatchEffect';
import { useMounted } from '../lifecycle/useMounted';

// 假设的 useMounted Hook

describe('useWatchEffect test suites', () => {
  // 在测试前启用和配置假定时器
  beforeAll(() => {
    jest.useFakeTimers();
  });

  // 在测试中捕获 console.log 的输出
  let consoleLogSpy: jest.SpyInstance;

  beforeEach(() => {
    // 捕获 console.log 的调用
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    // 恢复原始的 console.log 实现
    consoleLogSpy.mockRestore();
  });

  it('the stop function should make effect stop listening.', () => {
    const { result } = renderHook(() => {
      const [state, setState] = useState('running');
      const stopRef = useRef<any>(undefined);

      stopRef.current = useWatchEffect(() => {
        return () => {
          setState('stopped');
        };
      });

      useEffect(() => {
        stopRef.current?.();
      }, []);

      return state;
    });

    expect(result.current).toBe('stopped');
  });

  it('async effect and cleanup should be executed.', async () => {
    const mockFetchData = jest.fn((): Promise<string> => {
      return new Promise((res) => {
        setTimeout(() => {
          res('mockFetchData');
        }, 2000);
      });
    });

    let flag = true;

    const { result, unmount } = renderHook(() => {
      const [state, setState] = useState('');

      useWatchEffect(async () => {
        const data = await mockFetchData();

        setState(data);

        return () => {
          flag = false;
        };
      });

      return state;
    });

    jest.advanceTimersByTime(2000);

    await waitFor(() => {
      expect(result.current).toBe('mockFetchData');
      unmount();
      expect(flag).toBe(false);
    });
  });

  it('should log the count at each interval update.', () => {
    const INTERVAL_TIME = 500;

    // 1. 挂载 Hook
    const { result } = renderHook(() => {
      const [count, setCount] = useState(0);

      // 捕获 setCount，以便外部 act 中使用
      const setCountRef = useRef(setCount);
      const countRef = useRef(count);
      countRef.current = count;

      useMounted(() => {
        // 设置定时器，但由于是 useMounted，它只会在 Hook 挂载后设置一次
        const intervalId = setInterval(() => {
          // 必须使用函数式更新，否则 count 会捕获到初始值 0
          setCountRef.current((prev) => prev + 1);
        }, INTERVAL_TIME);

        return () => clearInterval(intervalId);
      });

      // 2. 监听 count 变化并输出
      useWatchEffect(() => {
        // 这里会输出 count 的最新值
        // eslint-disable-next-line no-console
        console.log(count);
      }, [count]);

      return count; // 返回 count 的最新值
    });

    // 初始状态检查
    // 第一次渲染时，count 为 0，useWatchEffect 执行一次
    expect(result.current).toBe(0);
    expect(consoleLogSpy).toHaveBeenCalledWith(0);
    expect(consoleLogSpy).toHaveBeenCalledTimes(1);

    // --- 第一次更新 (t = 500ms) ---
    act(() => {
      // 3. 快进时间，触发 setInterval 的第一次回调
      jest.advanceTimersByTime(INTERVAL_TIME);
    });

    // 检查状态和 log 输出
    expect(result.current).toBe(1);
    expect(consoleLogSpy).toHaveBeenCalledWith(1);
    expect(consoleLogSpy).toHaveBeenCalledTimes(2);

    // --- 第二次更新 (t = 1000ms) ---
    act(() => {
      // 再次快进时间，触发 setInterval 的第二次回调
      jest.advanceTimersByTime(INTERVAL_TIME);
    });

    // 检查状态和 log 输出
    expect(result.current).toBe(2);
    expect(consoleLogSpy).toHaveBeenCalledWith(2);
    expect(consoleLogSpy).toHaveBeenCalledTimes(3);
  });

  afterAll(() => {
    jest.useRealTimers();
  });
});
