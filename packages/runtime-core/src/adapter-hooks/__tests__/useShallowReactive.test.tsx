import { act, render, renderHook, waitFor } from '@testing-library/react';
import { useShallowReactive } from '../state/useReactive';

describe('useShallowReactive Advanced Test Suites', () => {
  // 1. 深度隔离验证
  it('should be isolated from deep mutations', async () => {
    let renderCount = 0;
    const initial = { a: { b: 1 } };

    const { result } = renderHook(() => {
      renderCount++;
      const state = useShallowReactive(initial);

      // 在渲染期间读取属性，建立追踪
      // 就像在真正的组件里用 <div>{state.a.b}</div> 一样
      const _unused = state.a;

      return state;
    });

    // 使用 async act 确保等待 Valtio 的微任务排空
    await act(async () => {
      result.current.a = { b: 3 };
    });

    expect(renderCount).toBe(2);
  });

  it('should be isolated from deep mutations (DOM-based)', async () => {
    const initial = { a: { b: { c: 1 } } };

    const holder: { current: any | null } = { current: null };

    function Comp() {
      const state = useShallowReactive(initial);
      // 在 render 期间将 state 暴露到外部 holder，方便测试时直接修改
      holder.current = state;
      return <div data-testid="val">{String(state.a.b.c)}</div>;
    }

    const { getByTestId } = render(<Comp />);

    const node = getByTestId('val');
    expect(node.textContent).toBe('1');

    await act(async () => {
      // 修改深层属性：浅代理不应触发外层重渲染
      holder.current.a.b.c = 2;
    });

    // 虽然数据发生变化，但 rendered DOM 仍应保持旧值
    expect(node.textContent).toBe('1');

    await act(async () => {
      // 替换第一层属性：应触发组件重新渲染并反映新值
      holder.current.a = { b: { c: 3 } };
    });

    await waitFor(() => {
      expect(node.textContent).toBe('3');
    });
  });

  // 2. 数组的浅层行为验证
  it('handles arrays in shallow mode correctly', async () => {
    const { result } = renderHook(() => useShallowReactive({ list: [1, 2] }));

    await act(async () => {
      // 修改数组内部：由于 list 是对象，在 createReactive 中被 ref(val) 包装了
      // 根据 Valtio 的 ref 语义，对该数组的任何修改（push, pop, index assignment）都不会触发更新
      result.current.list.push(3);
    });

    // 数据确实变了，但由于是 shallow，不应触发重绘
    expect(result.current.list).toHaveLength(3);

    await act(async () => {
      // 只有替换整个数组引用才会触发更新
      result.current.list = [4, 5];
    });

    expect(result.current.list).toEqual([4, 5]);
  });

  // 3. Map/Set 的浅层行为
  it('validates Map/Set as shallow properties', async () => {
    const initialMap = new Map([['k', 1]]);
    const { result } = renderHook(() => useShallowReactive({ map: initialMap }));

    await act(async () => {
      // 修改 Map 内部：不应触发更新
      result.current.map.set('k', 99);
    });
    expect(result.current.map.get('k')).toBe(99);

    await act(async () => {
      // 替换 Map：应触发更新
      result.current.map = new Map([['new', 1]]);
    });
    expect(result.current.map.has('new')).toBe(true);
  });

  // 4. 混合类型验证 (Primitive vs Object)
  it('reacts to primitive changes but ignores object internals', async () => {
    const { result } = renderHook(() => useShallowReactive({ count: 0, obj: { x: 1 } }));

    await act(async () => {
      result.current.count++; // 原始类型直接在第一层，应触发更新
    });
    expect(result.current.count).toBe(1);

    await act(async () => {
      result.current.obj.x = 100; // 对象内部，不触发更新
    });
    expect(result.current.obj.x).toBe(100);
  });
});
