import { act, renderHook } from '@testing-library/react';
import { useReactive } from '../state/useReactive';

describe('useReactive Advanced Test Suites', () => {
  // 1. 数组操作测试 (对应 arr.value.push)
  it('reacts to array mutations like push and index assignment', async () => {
    const { result } = renderHook(() => useReactive({ arr: [1, 2] }));

    await act(async () => {
      result.current.arr.push(3); // 模拟 <button onClick={() => arr.push(1)}>
    });
    expect(result.current.arr).toHaveLength(3);
    expect(result.current.arr[2]).toBe(3);

    await act(async () => {
      result.current.arr[0] = 100;
    });
    expect(result.current.arr[0]).toBe(100);
  });

  // 2. Map 转换与操作测试 (对应 map.value.set)
  it('reacts to Map mutations', async () => {
    const initialMap = new Map([['key', 1]]);
    const { result } = renderHook(() => useReactive({ map: initialMap }));

    await act(async () => {
      // 模拟 map.set('key', map.get('key') + 1)
      const currentVal = result.current.map.get('key')!;
      result.current.map.set('key', currentVal + 1);
    });

    expect(result.current.map.get('key')).toBe(2);
  });

  // 3. Set 转换与操作测试 (对应 set.value.add)
  it('reacts to Set mutations', async () => {
    const { result } = renderHook(() => useReactive({ tags: new Set([1]) }));

    await act(async () => {
      result.current.tags.add(2);
    });

    expect(result.current.tags.has(2)).toBe(true);
    expect(result.current.tags.size).toBe(2);
  });

  // 4. 读写混合场景测试 (对应 a = arr[0]++)
  it('handles mixed read-write operations in a single tick', async () => {
    const { result } = renderHook(() => useReactive({ arr: [10] }));

    await act(async () => {
      // 模拟 a = state.arr[0]++
      // 这会同时触发 getter (读取 10) 和 setter (写入 11)
      let a: number;
      a = result.current.arr[0]!++;

      expect(a).toBe(10); // 后置自增，a 拿到旧值
    });

    expect(result.current.arr[0]).toBe(11); // 状态已更新
  });
});
