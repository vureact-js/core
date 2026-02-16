import { act, renderHook, waitFor } from '@testing-library/react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useWatchEffect } from '../effect/useWatchEffect';
import { useMounted } from '../lifecycle/useMounted';

describe('useWatchEffect test suites', () => {
  beforeAll(() => {
    jest.useFakeTimers();
  });

  let consoleLogSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  it('the stop function should make effect stop listening.', () => {
    const { result } = renderHook(() => {
      const [state, setState] = useState('running');
      const stopRef = useRef<(() => void) | undefined>(undefined);

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

  it('stop should be idempotent and run cleanup immediately once.', () => {
    const cleanup = jest.fn();
    let stop: () => void = () => {};

    renderHook(() => {
      stop = useWatchEffect(() => cleanup, []);
    });

    act(() => {
      stop();
      stop();
    });

    expect(cleanup).toHaveBeenCalledTimes(1);
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
    const intervalTime = 500;

    const { result } = renderHook(() => {
      const [count, setCount] = useState(0);
      const setCountRef = useRef(setCount);

      useMounted(() => {
        const intervalId = setInterval(() => {
          setCountRef.current((prev) => prev + 1);
        }, intervalTime);

        return () => clearInterval(intervalId);
      });

      useWatchEffect(() => {
        // eslint-disable-next-line no-console
        console.log(count);
      }, [count]);

      return count;
    });

    expect(result.current).toBe(0);
    expect(consoleLogSpy).toHaveBeenCalledWith(0);
    expect(consoleLogSpy).toHaveBeenCalledTimes(1);

    act(() => {
      jest.advanceTimersByTime(intervalTime);
    });

    expect(result.current).toBe(1);
    expect(consoleLogSpy).toHaveBeenCalledWith(1);
    expect(consoleLogSpy).toHaveBeenCalledTimes(2);

    act(() => {
      jest.advanceTimersByTime(intervalTime);
    });

    expect(result.current).toBe(2);
    expect(consoleLogSpy).toHaveBeenCalledWith(2);
    expect(consoleLogSpy).toHaveBeenCalledTimes(3);
  });

  it('default useWatchEffect should run in pre timing (before normal effect).', () => {
    const order: string[] = [];
    let setCount: (n: number) => void = () => {};

    renderHook(() => {
      const [count, setLocalCount] = useState(0);
      setCount = setLocalCount;

      useLayoutEffect(() => {
        order.push('layout');
      }, [count]);

      useEffect(() => {
        order.push('effect');
      }, [count]);

      useWatchEffect(() => {
        order.push('watch-pre-default');
      }, [count]);
    });

    order.length = 0;

    act(() => {
      setCount(1);
    });

    expect(order.indexOf('watch-pre-default')).toBeGreaterThan(-1);
    expect(order.indexOf('watch-pre-default')).toBeLessThan(order.indexOf('effect'));
  });

  it('should support flush override to post timing.', () => {
    const order: string[] = [];
    let setCount: (n: number) => void = () => {};

    renderHook(() => {
      const [count, setLocalCount] = useState(0);
      setCount = setLocalCount;

      useEffect(() => {
        order.push('effect');
      }, [count]);

      useWatchEffect(
        () => {
          order.push('watch-post');
        },
        [count],
        { flush: 'post' },
      );
    });

    order.length = 0;

    act(() => {
      setCount(1);
    });

    expect(order.indexOf('watch-post')).toBeGreaterThan(order.indexOf('effect'));
  });

  it('onCleanup registration should take precedence over returned cleanup.', () => {
    const cleanupFromArg = jest.fn();
    const cleanupFromReturn = jest.fn();
    let setCount: (n: number) => void = () => {};

    renderHook(() => {
      const [count, setLocalCount] = useState(0);
      setCount = setLocalCount;

      useWatchEffect(
        (onCleanup) => {
          onCleanup?.(cleanupFromArg);
          return cleanupFromReturn;
        },
        [count],
      );
    });

    act(() => {
      setCount(1);
    });

    expect(cleanupFromArg).toHaveBeenCalledTimes(1);
    expect(cleanupFromReturn).not.toHaveBeenCalled();
  });

  afterAll(() => {
    jest.useRealTimers();
  });
});
