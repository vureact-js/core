import { act, renderHook } from '@testing-library/react';
import { useState$ } from '../state/useState$';

describe('useState$ test suites', () => {
  // 1. 测试基础类型 (Primitives)
  it('should handle primitive values like standard useState', () => {
    const { result } = renderHook(() => useState$(0));

    expect(result.current[0]).toBe(0);

    act(() => {
      result.current[1](10);
    });

    expect(result.current[0]).toBe(10);
  });

  // 2. 测试对象类型的自动合并 (Immer 模式 - 默认)
  it('should auto-merge object properties by default (Deep/Immer mode)', () => {
    const initialValue = { name: 'Alice', age: 25, settings: { theme: 'dark' } };
    const { result } = renderHook(() => useState$(initialValue));

    expect(result.current[0]).toEqual(initialValue);

    // 更新部分属性
    act(() => {
      // @ts-ignore: 测试 Partial 更新
      result.current[1]({ age: 26 });
    });

    // 期望 name 保持不变，age 更新 (合并行为)
    expect(result.current[0]).toEqual({
      name: 'Alice',
      age: 26,
      settings: { theme: 'dark' },
    });
  });

  // 3. 测试对象类型的自动合并 (Shallow 模式)
  it('should merge object properties even in shallow mode', () => {
    const { result } = renderHook(() => useState$({ count: 1, text: 'hello' }, true));

    act(() => {
      result.current[1]({ count: 2 });
    });

    expect(result.current[0]).toEqual({ count: 2, text: 'hello' });
  });

  // 4. 测试数组 (应该是替换行为，而不是合并)
  it('should replace arrays instead of merging', () => {
    const { result } = renderHook(() => useState$([1, 2]));

    act(() => {
      result.current[1]([3, 4]);
    });

    // 数组应该被整个替换
    expect(result.current[0]).toEqual([3, 4]);
  });

  // 5. 测试 Map (替换行为)
  it('should replace Map objects', () => {
    const initialMap = new Map([['key1', 'value1']]);
    const { result } = renderHook(() => useState$(initialMap));

    const newMap = new Map([['key2', 'value2']]);

    act(() => {
      result.current[1](newMap);
    });

    expect(result.current[0]).toBe(newMap);
    expect(result.current[0].get('key2')).toBe('value2');
    expect(result.current[0].has('key1')).toBe(false);
  });

  // 6. 测试函数式初始化 (Lazy Initialization)
  it('should support lazy initialization via function', () => {
    const initFn = jest.fn(() => ({ val: 100 }));
    const { result } = renderHook(() => useState$(initFn));

    expect(result.current[0]).toEqual({ val: 100 });
    expect(initFn).toHaveBeenCalledTimes(1);
  });

  // 7. 测试深层更新的不变性 (Immer verify)
  // 确保修改不会影响旧引用（除非是浅层模式且未变的部分）
  it('should produce new references for updated objects (Immer)', () => {
    const initial = { nested: { count: 1 }, other: 'static' };
    const { result } = renderHook(() => useState$(initial));

    const previousState = result.current[0];

    act(() => {
      // @ts-ignore
      result.current[1]({ nested: { count: 2 } });
    });

    const newState = result.current[0];

    // 内容更新了
    expect(newState.nested.count).toBe(2);
    // 引用变了
    expect(newState).not.toBe(previousState);
    // 未改变的部分引用通常应该保持一致 (Immer 特性)
    // 注意：如果是 shallow mode 手动 spread，这里也可能是相等的。
    // 但在 Immer 模式下，未触碰的节点通常共享引用。
    // 由于我们是 Object.assign，顶层引用肯定变了，other 属性是直接引用的。
    expect(newState.other).toBe(previousState.other);
  });

  it('should still perform shallow merge in shallow mode', () => {
    const initialValue = { config: { a: 1, b: 2 } };
    const { result } = renderHook(() => useState$(initialValue, true));

    act(() => {
      // @ts-ignore
      result.current[1]({ config: { a: 99 } });
    });

    expect(result.current[0].config.a).toBe(99);
    // 在 shallow 模式下，config.b 应该消失，因为 config 对象被整体替换了
    expect(result.current[0].config.b).toBeUndefined();
  });

  it('should perform deep merge in Immer mode to preserve sister properties', () => {
    const initialValue = {
      config: { a: 1, b: 2 },
      other: 'keep',
    };
    const { result } = renderHook(() => useState$(initialValue));

    act(() => {
      // 仅更新 config.a
      // @ts-ignore
      result.current[1]({ config: { a: 99 } });
    });

    // 验证结果
    expect(result.current[0].config.a).toBe(99); // 更新了
    expect(result.current[0].config.b).toBe(2); // 被保留了 (Deep Merge 成功)
    expect(result.current[0].other).toBe('keep'); // 顶层其他属性被保留
  });
});

describe('useState$ Callback & Deep Merge Test', () => {
  it('should support callback updates with simple value', () => {
    const { result } = renderHook(() => useState$(1));

    act(() => {
      result.current[1]((prev) => {
        prev = 10;
        return 10; // 统一返回新值
      });
    });

    expect(result.current[0]).toEqual(10);

    act(() => {
      result.current[1]((prev) => {
        prev++;
        prev--;
        prev /= 2;
        return prev; // 统一返回新值
      });
    });

    expect(result.current[0]).toEqual(5);
  });

  // 2. 验证回调函数更新 (Immer 模式下操作数组)
  it('should support callback updates with array push', () => {
    const { result } = renderHook(() => useState$([1, 2]));

    act(() => {
      result.current[1]((prev) => {
        prev.push(3);
        return prev; // 统一返回新值
      });
    });

    expect(result.current[0]).toEqual([1, 2, 3]);
  });

  // 2. 验证深度合并 (Immer 模式下保留兄弟属性)
  it('should perform deep merge to preserve nested properties', () => {
    const { result } = renderHook(() =>
      useState$({
        user: { name: 'Alice', age: 18 },
        status: 'active',
      }),
    );

    act(() => {
      // @ts-ignore 直接传值更新
      result.current[1]({ user: { age: 19 } });
    });

    // 验证：name 应该被保留 (深度合并)，status 应该被保留
    expect(result.current[0].user).toEqual({ name: 'Alice', age: 19 });
    expect(result.current[0].status).toBe('active');
  });

  // 3. 验证 Shallow 模式下的回调行为
  it('should handle callback in shallow mode', () => {
    const { result } = renderHook(() => useState$({ a: 1, b: { c: 1 } }, true));

    act(() => {
      result.current[1]((prev: any) => ({ a: 2 }));
    });

    expect(result.current[0].a).toBe(2);
    expect(result.current[0].b.c).toBe(1); // 第一层合并，b 被保留
  });
});
