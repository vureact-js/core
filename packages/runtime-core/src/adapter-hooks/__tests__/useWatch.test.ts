import { act, renderHook } from '@testing-library/react';
import { useEffect, useLayoutEffect, useState } from 'react';
import { useWatch } from '../effect/useWatch';

describe('useWatch test suites', () => {
  let mockCallback: jest.Mock = jest.fn();
  let mockDeepCallback: jest.Mock;
  let mockShallowCallback: jest.Mock;

  let setCount: (count: number) => void = () => {};
  let stopFn = () => {};

  beforeEach(() => {
    mockCallback = jest.fn();
    mockDeepCallback = jest.fn();
    mockShallowCallback = jest.fn();
  });

  it('should NOT call the effect upon initial mount (default behavior).', () => {
    renderHook(() => {
      const [count] = useState(0);
      useWatch(count, mockCallback);
    });

    expect(mockCallback).not.toHaveBeenCalled();
  });

  it('should call the effect ONLY when the source value changes (Primitive).', () => {
    renderHook(() => {
      const [count, sC] = useState(0);
      setCount = sC;
      useWatch(count, mockCallback);
    });

    act(() => {
      setCount(1);
    });

    expect(mockCallback).toHaveBeenCalledTimes(1);
    expect(mockCallback).toHaveBeenCalledWith(1, 0, expect.any(Function));

    act(() => {
      setCount(1);
    });

    expect(mockCallback).toHaveBeenCalledTimes(1);

    act(() => {
      setCount(2);
    });

    expect(mockCallback).toHaveBeenCalledTimes(2);
    expect(mockCallback).toHaveBeenCalledWith(2, 1, expect.any(Function));
  });

  it('should support function as source (Getter style).', () => {
    renderHook(() => {
      const [count, sC] = useState(0);
      setCount = sC;
      useWatch(() => count, mockCallback);
    });

    act(() => {
      setCount(1);
    });

    expect(mockCallback).toHaveBeenCalledTimes(1);
    expect(mockCallback).toHaveBeenCalledWith(1, 0, expect.any(Function));
  });

  it('should call the effect immediately when {immediate: true}.', () => {
    renderHook(() => {
      const [count] = useState(0);
      useWatch(count, mockCallback, { immediate: true });
    });

    expect(mockCallback).toHaveBeenCalledTimes(1);
    expect(mockCallback).toHaveBeenCalledWith(0, undefined, expect.any(Function));
  });

  it('should call the effect only ONCE when {once: true}.', () => {
    renderHook(() => {
      const [count, sC] = useState(0);
      setCount = sC;
      useWatch(count, mockCallback, { once: true });
    });

    act(() => {
      setCount(1);
    });

    expect(mockCallback).toHaveBeenCalledTimes(1);

    act(() => {
      setCount(2);
    });

    expect(mockCallback).toHaveBeenCalledTimes(1);
  });

  it('should call immediately and stop listening when {immediate: true, once: true}.', () => {
    renderHook(() => {
      const [count, sC] = useState(0);
      setCount = sC;
      useWatch(count, mockCallback, { immediate: true, once: true });
    });

    expect(mockCallback).toHaveBeenCalledTimes(1);

    act(() => {
      setCount(1);
    });

    expect(mockCallback).toHaveBeenCalledTimes(1);
  });

  it('the stop function should make effect stop listening.', () => {
    renderHook(() => {
      const [count, sC] = useState(0);
      setCount = sC;
      stopFn = useWatch(count, mockCallback);
      return count;
    });

    act(() => {
      setCount(1);
    });

    expect(mockCallback).toHaveBeenCalledTimes(1);

    act(() => {
      stopFn();
    });

    act(() => {
      setCount(2);
    });

    expect(mockCallback).toHaveBeenCalledTimes(1);
  });

  it('should call the destructor when dependencies change or on unmount/stop.', () => {
    const mockDestructor = jest.fn();

    const { unmount } = renderHook(() => {
      const [count, sC] = useState(0);
      setCount = sC;
      stopFn = useWatch(count, () => mockDestructor, {});
    });

    act(() => {
      setCount(1);
    });

    expect(mockDestructor).not.toHaveBeenCalled();

    act(() => {
      setCount(2);
    });

    expect(mockDestructor).toHaveBeenCalledTimes(1);

    act(() => {
      stopFn();
      stopFn();
    });

    expect(mockDestructor).toHaveBeenCalledTimes(2);

    unmount();
    expect(mockDestructor).toHaveBeenCalledTimes(2);
  });

  it('should use deep comparison to SKIP execution when content is the same but reference is new.', () => {
    let setStateArr: (arr: number[]) => void = () => {};

    renderHook(() => {
      const [arr, setArr] = useState([1, 2]);
      setStateArr = setArr;

      useWatch(() => arr, mockDeepCallback, { deep: true });
      useWatch(() => arr, mockShallowCallback);
    });

    expect(mockDeepCallback).not.toHaveBeenCalled();
    expect(mockShallowCallback).not.toHaveBeenCalled();

    act(() => {
      setStateArr([1, 2]);
    });

    expect(mockShallowCallback).toHaveBeenCalledTimes(1);
    expect(mockShallowCallback).toHaveBeenCalledWith([1, 2], [1, 2], expect.any(Function));
    expect(mockDeepCallback).not.toHaveBeenCalled();

    act(() => {
      setStateArr([1, 2, 3]);
    });

    expect(mockShallowCallback).toHaveBeenCalledTimes(2);
    expect(mockShallowCallback).toHaveBeenCalledWith([1, 2, 3], [1, 2], expect.any(Function));
    expect(mockDeepCallback).toHaveBeenCalledTimes(1);
    expect(mockDeepCallback).toHaveBeenCalledWith([1, 2, 3], [1, 2], expect.any(Function));
  });

  it('should support deep:number as limited depth comparison.', () => {
    const deep1 = jest.fn();
    const deep2 = jest.fn();
    let setState: (value: { a: { b: number } }) => void = () => {};

    renderHook(() => {
      const [state, setLocalState] = useState({ a: { b: 1 } });
      setState = setLocalState;

      useWatch(() => state, deep1, { deep: 1 });
      useWatch(() => state, deep2, { deep: 2 });
    });

    act(() => {
      setState({ a: { b: 1 } });
    });

    expect(deep1).toHaveBeenCalledTimes(1);
    expect(deep2).not.toHaveBeenCalled();

    act(() => {
      setState({ a: { b: 2 } });
    });

    expect(deep1).toHaveBeenCalledTimes(2);
    expect(deep2).toHaveBeenCalledTimes(1);
  });

  it('should allow cleanup registration via onCleanup and prefer it over returned cleanup.', () => {
    const cleanupFromArg = jest.fn();
    const cleanupFromReturn = jest.fn();

    renderHook(() => {
      const [count, setLocalCount] = useState(0);
      setCount = setLocalCount;

      useWatch(count, (_value, _oldValue, onCleanup) => {
        onCleanup?.(cleanupFromArg);
        return cleanupFromReturn;
      });
    });

    act(() => {
      setCount(1);
    });

    act(() => {
      setCount(2);
    });

    expect(cleanupFromArg).toHaveBeenCalledTimes(1);
    expect(cleanupFromReturn).not.toHaveBeenCalled();
  });

  it('should respect flush timing (pre/post) in React execution order.', () => {
    const order: string[] = [];

    renderHook(() => {
      const [count, setLocalCount] = useState(0);
      setCount = setLocalCount;

      useLayoutEffect(() => {
        order.push('layout');
      }, [count]);

      useEffect(() => {
        order.push('effect');
      }, [count]);

      useWatch(
        count,
        () => {
          order.push('watch-pre');
        },
        { flush: 'pre' },
      );

      useWatch(
        count,
        () => {
          order.push('watch-post');
        },
        { flush: 'post' },
      );
    });

    order.length = 0;

    act(() => {
      setCount(1);
    });

    expect(order.indexOf('watch-pre')).toBeGreaterThan(-1);
    expect(order.indexOf('watch-post')).toBeGreaterThan(-1);
    expect(order.indexOf('watch-pre')).toBeLessThan(order.indexOf('effect'));
    expect(order.indexOf('watch-post')).toBeGreaterThan(order.indexOf('layout'));
  });
});
