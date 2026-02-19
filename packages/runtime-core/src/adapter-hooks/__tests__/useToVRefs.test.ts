import { act, renderHook } from '@testing-library/react';
import { useReactive } from '../state/useReactive';
import { useToVRefs } from '../state/useToVRefs';

describe('useToVRefs Advanced Test Suites', () => {
  // 1. 基础功能：对象解构与双向绑定
  it('converts a reactive object into a plain object of refs', async () => {
    const { result } = renderHook(() => {
      const state = useReactive({ foo: 1, bar: 'hello' });
      const refs = useToVRefs(state);
      return { state, refs };
    });

    // 验证结构：返回的应该是一个普通对象，但属性是 Ref
    expect(result.current.refs.foo.value).toBe(1);
    expect(result.current.refs.bar.value).toBe('hello');

    // 动作 A: 修改 Ref -> 影响 State
    await act(async () => {
      result.current.refs.foo.value = 100;
    });
    expect(result.current.state.foo).toBe(100);
    expect(result.current.refs.foo.value).toBe(100);

    // 动作 B: 修改 State -> 影响 Ref
    await act(async () => {
      result.current.state.bar = 'world';
    });
    expect(result.current.refs.bar.value).toBe('world');
  });

  // 2. 数组支持
  it('handles reactive arrays correctly', async () => {
    const { result } = renderHook(() => {
      const list = useReactive([1, 2, 3]);
      const refs = useToVRefs(list);
      return { list, refs };
    });

    // 验证返回的是数组结构
    expect(Array.isArray(result.current.refs)).toBe(true);
    expect(result.current.refs).toHaveLength(3);
    expect(result.current.refs[0]!.value).toBe(1);

    // 双向绑定测试
    await act(async () => {
      result.current.refs[0]!.value = 99;
    });
    expect(result.current.list[0]).toBe(99);
  });

  // 3. 引用稳定性 (Performance)
  // 验证 useMemo 是否生效：只要源对象引用不变，返回的 refs 对象也不变
  it('maintains the identity of the refs container across renders', async () => {
    let renderCount = 0;
    const { result, rerender } = renderHook(() => {
      renderCount++;
      const state = useReactive({ count: 0 });
      const refs = useToVRefs(state);
      return { state, refs };
    });

    const firstRefs = result.current.refs;
    const firstCountRef = result.current.refs.count;

    // 触发重绘（例如父组件更新），但不改变 state 本身
    rerender();

    expect(renderCount).toBe(2);
    // 容器对象引用必须相同
    expect(result.current.refs).toBe(firstRefs);
    // 内部的 Ref 对象引用也必须相同
    expect(result.current.refs.count).toBe(firstCountRef);
  });

  // 4. 组件订阅能力
  // useToVRefs 内部调用了 useProxySubscribe，这意味着即使不读取 .value，
  // 仅仅解构这一行为也应该让组件订阅 state 的变化。
  it('triggers re-render when source properties change', async () => {
    let renderCount = 0;
    const { result } = renderHook(() => {
      renderCount++;
      const state = useReactive({ a: 1 });
      // 仅仅调用转换，模拟 const { a } = useToVRefs(state)
      const refs = useToVRefs(state);
      return { state, refs };
    });

    expect(renderCount).toBe(1);

    await act(async () => {
      // 修改源对象
      result.current.state.a = 2;
    });

    // 应当触发组件重绘
    expect(renderCount).toBe(2);
    expect(result.current.refs.a.value).toBe(2);
  });

  // 5. 警告机制 (开发环境)
  it('warns if passed a non-proxy object', () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    // 强制设置环境为非生产环境 (Jest 默认就是，但为了明确语义)
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    renderHook(() => useToVRefs({ a: 1 } as any));

    expect(consoleSpy).toHaveBeenCalledWith('useToVRefs() expects a reactive object.');

    consoleSpy.mockRestore();
    process.env.NODE_ENV = originalEnv;
  });

  // 6. 混合类型与嵌套处理
  it('handles nested objects correctly (returns ref to the object)', async () => {
    const { result } = renderHook(() => {
      const state = useReactive({
        user: { name: 'John', age: 30 },
      });
      const refs = useToVRefs(state);
      return { state, refs };
    });

    // refs.user.value 应该是指向 user Proxy 的引用
    expect(result.current.refs.user.value.name).toBe('John');

    await act(async () => {
      // 通过 Ref 修改深层属性
      result.current.refs.user.value.name = 'Doe';
    });

    expect(result.current.state.user.name).toBe('Doe');
  });
});
