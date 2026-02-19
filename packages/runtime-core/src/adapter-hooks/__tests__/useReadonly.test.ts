import { act, renderHook } from '@testing-library/react';
import { useReactive } from '../state/useReactive';
import { useReadonly, useShallowReadonly } from '../state/useReadonly';
import { useVRef } from '../state/useVRef';

describe('useReadonly Advanced Test Suites', () => {
  it('should sync with the source proxy automatically', async () => {
    const { result: source } = renderHook(() => useReactive({ count: 1 }));

    // 使用 useReadonly 观察 source
    const { result: readonlyState } = renderHook(() => useReadonly(source.current));

    expect(readonlyState.current.count).toBe(1);

    // 修改源对象
    await act(async () => {
      source.current.count++;
    });

    // 只读快照应自动同步新值
    expect(readonlyState.current.count).toBe(2);
  });

  it('should be immutable (Valtio snapshot behavior)', async () => {
    const { result: source } = renderHook(() => useReactive({ a: 1 }));
    const { result: readonlyState } = renderHook(() => useReadonly(source.current));

    // 在严格模式下，修改 snapshot 属性会抛出错误
    expect(() => {
      (readonlyState.current as any).a = 2;
    }).toThrow();
  });

  it('should handle deep nesting and reactive updates', async () => {
    const { result: source } = renderHook(() => useReactive({ nested: { val: 'old' } }));
    const { result: readonlyState } = renderHook(() => useReadonly(source.current));

    await act(async () => {
      source.current.nested.val = 'new';
    });

    expect(readonlyState.current.nested.val).toBe('new');
  });

  it('should unwrap useVRef, eliminating the need to access via .value', async () => {
    const { result: source } = renderHook(() => useVRef(1));

    // 使用 useReadonly 解包 .value
    const { result: readonlyState } = renderHook(() => useReadonly(source.current));

    expect(readonlyState.current).toBe(1);

    // 修改源对象
    await act(async () => {
      source.current.value++;
    });

    // 只读快照应自动同步新值
    expect(readonlyState.current).toBe(2);
  });

  it('should make plain objects read-only', async () => {
    const source = { nested: { val: 'old' } };

    const { result: readonlyState } = renderHook(() => useReadonly(source));

    expect(readonlyState).not.toEqual(source);

    expect(() => {
      (readonlyState.current as any).nested.val = 'new';
    }).toThrow();

    await act(async () => {
      source.nested.val = 'new';
    });

    expect(readonlyState.current.nested.val).not.toBe('new');
  });
});

describe('useShallowReadonly Advanced Test Suites', () => {
  it('prevents modification of top-level properties', async () => {
    const { result: source } = renderHook(() => useReactive({ a: 1 }));
    const { result: shallowReadonly } = renderHook(() => useShallowReadonly(source.current));
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    // 尝试修改第一层属性（应抛出错误）
    expect(() => {
      (shallowReadonly.current as any).a = 2;
    }).toThrow();

    // 应拦截修改并发出警告
    expect(warnSpy).toHaveBeenCalledWith('Cannot modify readonly object');

    expect(shallowReadonly.current.a).toBe(1);
  });

  it('allows modification of nested properties via proxy reference', async () => {
    // shallowReadonly 的设计是：第一层拦截，但嵌套对象依然指向原始 Proxy
    const { result: source } = renderHook(() => useReactive({ obj: { count: 1 } }));
    const { result: shallowReadonly } = renderHook(() => useShallowReadonly(source.current));

    let renderCount = 0;
    const { result: tracker } = renderHook(() => {
      renderCount++;
      return shallowReadonly.current.obj.count;
    });

    await act(async () => {
      // 嵌套对象是可写的，因为它本质是原始 Proxy 的引用
      (shallowReadonly.current.obj as any).count = 100;
    });

    expect(shallowReadonly.current.obj.count).toBe(100);
    expect(source.current.obj.count).toBe(100);
  });

  it('reflects top-level changes made to the source proxy', async () => {
    const { result: source } = renderHook(() => useReactive({ a: 1 }));
    const { result: shallowReadonly } = renderHook(() => useShallowReadonly(source.current));

    await act(async () => {
      source.current.a = 99;
    });

    // 虽不能通过只读对象改，但源对象的改动应能反映出来
    expect(shallowReadonly.current.a).toBe(99);
  });

  it('should make plain objects shallowly read-only.', async () => {
    const source = { a: 1, nested: { val: 'old' } };

    const { result: shallowReadonly } = renderHook(() => useShallowReadonly(source));

    expect(shallowReadonly).not.toEqual(source);

    expect(() => {
      (shallowReadonly.current as any).a++;
    }).toThrow();

    expect(() => {
      (shallowReadonly.current as any).nested.val = 'new';
    }).not.toThrow();

    await act(async () => {
      source.a = 2;
    });

    expect(shallowReadonly.current.a).not.toBe(2);
  });
});
