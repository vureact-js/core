import { act, renderHook } from '@testing-library/react';
import { useState } from 'react';
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

    // 初次挂载时不执行
    expect(mockCallback).not.toHaveBeenCalled();
  });

  it('should call the effect ONLY when the source value changes (Primitive).', () => {
    renderHook(() => {
      const [count, sC] = useState(0);
      setCount = sC;
      useWatch(count, mockCallback);
    });

    // 第一次更新 (0 -> 1)
    act(() => {
      setCount(1);
    });

    // Hook 重新渲染后，依赖项变化，执行回调
    expect(mockCallback).toHaveBeenCalledTimes(1);
    expect(mockCallback).toHaveBeenCalledWith(1, 0);

    // 第二次更新 (1 -> 1): 值不变，不应执行
    act(() => {
      setCount(1); // 再次设置为 1
    });

    // 重新渲染，但依赖值未变，不执行
    expect(mockCallback).toHaveBeenCalledTimes(1);

    // 第三次更新 (1 -> 2)
    act(() => {
      setCount(2);
    });

    expect(mockCallback).toHaveBeenCalledTimes(2);
    expect(mockCallback).toHaveBeenCalledWith(2, 1);
  });

  it('should support function as source (Getter style).', () => {
    renderHook(() => {
      const [count, sC] = useState(0);
      setCount = sC;

      // 监听函数返回的值
      useWatch(() => count, mockCallback);
      // useWatch([count], mockCallback);
      // useWatch(() => [count], mockCallback);
    });

    act(() => {
      setCount(1);
    });

    expect(mockCallback).toHaveBeenCalledTimes(1);
    expect(mockCallback).toHaveBeenCalledWith(1, 0);
    // expect(mockCallback).toHaveBeenCalledWith([1], [0]);
  });

  it('should call the effect immediately when {immediate: true}.', () => {
    renderHook(() => {
      const [count] = useState(0);
      useWatch(count, mockCallback, { immediate: true });
    });

    expect(mockCallback).toHaveBeenCalledTimes(1);
    expect(mockCallback).toHaveBeenCalledWith(0, 0);
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

    // 第二次更新 (1 -> 2): 不应执行
    act(() => {
      setCount(2);
    });
    expect(mockCallback).toHaveBeenCalledTimes(1); // 仍然是 1 次
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
      stopFn = useWatch(count, mockCallback); // 捕获 stop 函数
      return count;
    });

    // 1. 正常更新 (0 -> 1)
    act(() => {
      setCount(1);
    });

    expect(mockCallback).toHaveBeenCalledTimes(1);

    // 2. 调用 stop 函数
    act(() => {
      stopFn();
    });

    // 3. 再次更新 (1 -> 2): 不应执行
    act(() => {
      setCount(2);
    });

    // 停止后，回调不应再次执行
    expect(mockCallback).toHaveBeenCalledTimes(1);
  });

  it('should call the destructor when dependencies change or on unmount/stop.', () => {
    const mockDestructor = jest.fn();

    const { unmount } = renderHook(() => {
      const [count, sC] = useState(0);
      setCount = sC;
      stopFn = useWatch(count, () => mockDestructor, {});
    });

    // 1. 第一次更新 (0 -> 1): 触发 effect，注册清理函数
    act(() => {
      setCount(1);
    });

    expect(mockDestructor).not.toHaveBeenCalled();

    // 2. 第二次更新 (1 -> 2): 触发清理，然后再次注册新的清理函数
    act(() => {
      setCount(2);
    });

    // 此时，第一次 effect 返回的清理函数应该被调用了
    expect(mockDestructor).toHaveBeenCalledTimes(1);

    // 3. 调用 stop: 触发最后一次清理
    act(() => {
      stopFn();
    });

    // 检查 stop 是否触发清理
    expect(mockDestructor).toHaveBeenCalledTimes(2);

    // 4. Hook 卸载: 不应再有清理，因为 stop 已经执行了清理
    unmount();
    expect(mockDestructor).toHaveBeenCalledTimes(2); // 调用次数不变
  });

  it('should use deep comparison to SKIP execution when content is the same but reference is new.', () => {
    let setStateArr: (arr: number[]) => void = () => {};

    renderHook(() => {
      const [arr, setArr] = useState([1, 2]);
      setStateArr = setArr;

      // Watch 1: Deep watch (应跳过执行，因为内容没变)
      useWatch(() => arr, mockDeepCallback, { deep: true });

      // Watch 2: Shallow watch (应执行，因为引用变了)
      useWatch(() => arr, mockShallowCallback);
    });

    // 初始检查 (Mount)
    expect(mockDeepCallback).not.toHaveBeenCalled();
    expect(mockShallowCallback).not.toHaveBeenCalled();

    // 第一次更新：创建新数组引用，但内容相同
    act(() => {
      setStateArr([1, 2]);
    });

    // 浅层 watch 应该被触发（引用变化）
    expect(mockShallowCallback).toHaveBeenCalledTimes(1);
    expect(mockShallowCallback).toHaveBeenCalledWith([1, 2], [1, 2]);

    // 深层 watch 不应该被触发（值未变化）
    expect(mockDeepCallback).not.toHaveBeenCalled();

    // 第二次更新：内容和引用都变化
    act(() => {
      setStateArr([1, 2, 3]); // 内容和引用都变化
    });

    // 浅层 watch 再次触发
    expect(mockShallowCallback).toHaveBeenCalledTimes(2);
    expect(mockShallowCallback).toHaveBeenCalledWith([1, 2, 3], [1, 2]);

    // 深层 watch 现在应该触发
    expect(mockDeepCallback).toHaveBeenCalledTimes(1);
    expect(mockDeepCallback).toHaveBeenCalledWith([1, 2, 3], [1, 2]);
  });
});
