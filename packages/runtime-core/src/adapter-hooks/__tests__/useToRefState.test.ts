import { act, renderHook } from '@testing-library/react';
import { useReactive } from '../state/useReactive';
import { useToRefState } from '../state/useToRefState';

describe('useToRefState Advanced Test Suites', () => {
  // 1. 测试属性引用模式: useToRefState(state, 'key')
  // 这是最常用的模式，类似于 Vue 的 toRef(state, 'count')
  it('creates a ref linked to a reactive object property', async () => {
    const { result } = renderHook(() => {
      const state = useReactive({ count: 1, name: 'Alice' });
      const countRef = useToRefState(state, 'count');
      return { state, countRef };
    });

    // 初始值检查
    expect(result.current.countRef.value).toBe(1);

    // 1. 修改 Ref -> 影响 State
    await act(async () => {
      result.current.countRef.value = 2;
    });
    expect(result.current.state.count).toBe(2);
    expect(result.current.countRef.value).toBe(2);

    // 2. 修改 State -> 影响 Ref
    await act(async () => {
      result.current.state.count = 3;
    });
    expect(result.current.countRef.value).toBe(3);
  });

  // 测试带有默认值的属性引用
  it('handles default values for undefined properties', async () => {
    const { result } = renderHook(() => {
      const state = useReactive<{ count?: number }>({});
      // count 是 undefined，应该使用默认值 10
      const countRef = useToRefState(state, 'count', 10);
      return { state, countRef };
    });

    expect(result.current.countRef.value).toBe(10);

    // 当源属性被赋值后，Ref 应该更新为新值
    await act(async () => {
      result.current.state.count = 5;
    });
    expect(result.current.countRef.value).toBe(5);
  });

  // 2. 测试 Getter 模式: useToRefState(() => state.count * 2)
  // 类似于 Vue 的 computed 或 toRef(() => ...)
  it('creates a readonly ref from a getter', async () => {
    const { result } = renderHook(() => {
      const state = useReactive({ count: 1 });
      const doubleRef = useToRefState(() => state.count * 2);
      return { state, doubleRef };
    });

    expect(result.current.doubleRef.value).toBe(2);

    // 依赖项更新 -> Getter Ref 更新
    await act(async () => {
      result.current.state.count = 10;
    });
    expect(result.current.doubleRef.value).toBe(20);
  });

  // 3. 测试普通值模式: useToRefState(1)
  // 应该退化为 useRefState(1)
  it('creates a standard ref for primitive values', async () => {
    const { result } = renderHook(() => useToRefState(1));

    expect(result.current.value).toBe(1);

    await act(async () => {
      result.current.value = 2;
    });
    expect(result.current.value).toBe(2);
  });

  // 4. 测试 Proxy 透传模式: useToRefState(proxy)
  // 如果传入已经是 Proxy，应该原样返回并订阅
  it('returns the proxy itself if passed a reactive object', () => {
    const { result } = renderHook(() => {
      const state = useReactive({ a: 1 });
      const ref = useToRefState(state);
      return { state, ref };
    });

    // 引用同一性检查
    expect(result.current.ref).toBe(result.current.state);
  });

  // 5. 验证引用稳定性
  // 确保在组件重新渲染时，生成的 Ref 对象引用不会改变（除非依赖变了）
  it('maintains ref identity across renders', () => {
    const { result, rerender } = renderHook(() => {
      const state = useReactive({ count: 1 });
      const countRef = useToRefState(state, 'count');
      return { state, countRef };
    });

    const firstRef = result.current.countRef;

    // 触发组件重渲染 (但不改变 state 引用)
    rerender();

    expect(result.current.countRef).toBe(firstRef);
  });
});
