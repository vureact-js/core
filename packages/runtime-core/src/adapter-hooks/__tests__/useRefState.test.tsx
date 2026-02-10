import { act, render, renderHook, waitFor } from '@testing-library/react';
import { useRefState, useShallowRefState } from '../state/useRefState';

describe('useRefState / useShallowRefState Test Suites', () => {
  // 1. 验证 useRefState 的基础类型响应
  it('useRefState: reacts to primitive value changes', async () => {
    let renderCount = 0;
    const { result } = renderHook(() => {
      renderCount++;
      const count = useRefState(0);
      // 读取 .value 以建立追踪
      const _v = count.value;
      return count;
    });

    expect(result.current.value).toBe(0);

    await act(async () => {
      result.current.value++;
    });

    expect(result.current.value).toBe(1);
    expect(renderCount).toBe(2);
  });

  // 2. 验证 useRefState 的深层响应 (Deep)
  it('useRefState: reacts to deep object mutations', async () => {
    let renderCount = 0;
    const { result } = renderHook(() => {
      renderCount++;
      const state = useRefState({ a: { b: 1 } });
      const _v = state.value.a.b;
      return state;
    });

    await act(async () => {
      result.current.value.a.b++;
    });

    expect(result.current.value.a.b).toBe(2);
    expect(renderCount).toBe(2);
  });

  // 3. 验证 useShallowRefState 的浅层特性
  it('useShallowRefState: should be isolated from deep mutations (DOM-based)', async () => {
    const holder: { current: any | null } = { current: null };

    function Comp() {
      const state = useShallowRefState({ a: 1 });
      // 在 render 期间将 state 暴露到外部 holder（暴露 proxy，便于替换 value），方便测试时直接修改
      holder.current = state;
      return <div data-testid="val">{String(state.value.a)}</div>;
    }

    const { getByTestId } = render(<Comp />);

    const node = getByTestId('val');
    expect(node.textContent).toBe('1');

    await act(async () => {
      // 修改深层属性：浅 ref 不应触发外层重渲染
      holder.current.value.a++;
    });

    // 虽然数据发生变化，但 rendered DOM 仍应保持旧值
    expect(node.textContent).toBe('1');

    await act(async () => {
      // 替换第一层属性：应触发组件重新渲染并反映新值
      holder.current.value = { a: 3 };
    });

    await waitFor(() => {
      expect(node.textContent).toBe('3');
    });
  });

  // 4. 验证对已存在的 RefState 的兼容性
  it('should return the same ref if the value is already a RefState', () => {
    const { result: r1 } = renderHook(() => useRefState(1));
    const { result: r2 } = renderHook(() => useRefState(r1.current));

    expect(r1.current).toBe(r2.current);
  });

  // 5. 验证复杂结构 (Map) 在 RefState 中的表现
  it('handles Map in useRefState correctly', async () => {
    const { result } = renderHook(() => useRefState(new Map([['a', 1]])));

    await act(async () => {
      result.current.value.set('a', 2);
    });

    expect(result.current.value.get('a')).toBe(2);
  });
});
