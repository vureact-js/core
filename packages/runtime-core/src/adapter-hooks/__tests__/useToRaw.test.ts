import { renderHook } from '@testing-library/react';
import { useReactive, useShallowReactive } from '../state/useReactive';
import { useReadonly } from '../state/useReadonly';
import { useRefState, useShallowRefState } from '../state/useRefState';
import { useToRaw } from '../state/useToRaw';

describe('useToRaw Advanced Test Suites', () => {
  // 1. 验证 useShallowReactive
  it('should return the original object from useShallowReactive', () => {
    const source = { a: { b: 1 } };
    const { result: proxyRef } = renderHook(() => useShallowReactive(source));

    const raw = useToRaw(proxyRef.current);

    // raw 应该等价于 source，且不等于 proxy
    expect(raw).toEqual(source);
    expect(raw).not.toBe(proxyRef.current);
  });

  // 2. 验证 useRefState
  // 注意：useRefState 返回的是包装对象 { value: T } 的 Proxy
  it('should return the raw container object from useRefState', () => {
    const source = { count: 1 };
    const { result: refRef } = renderHook(() => useRefState(source));

    const rawContainer = useToRaw(refRef.current);

    // toRaw 作用于 ref 时，返回的是原始的 { value: proxy } 容器
    expect(rawContainer).toHaveProperty('value');
    expect(rawContainer?.value).not.toBe(source); // 因为 value 被深度代理了
  });

  // 3. 验证 useShallowRefState
  it('should return the raw container from useShallowRefState', () => {
    const source = { count: 1 };
    const { result: sRefRef } = renderHook(() => useShallowRefState(source));

    const rawContainer = useToRaw(sRefRef.current);

    expect(rawContainer?.value).toBe(source); // 浅引用，value 应指向原对象
  });

  // 4. 验证 useReadonly (快照)
  // 这是一个关键测试：由于 useReadonly 返回的是 Valtio 的 snapshot（快照），
  // 我们需要确认 snapshot 是否还保留了 RAW_TARGET
  it('should handle snapshots from useReadonly', () => {
    const source = { a: 1 };
    const { result: proxyRef } = renderHook(() => useReactive(source));
    const { result: readonlyRef } = renderHook(() => useReadonly(proxyRef.current));

    const raw = useToRaw(readonlyRef.current);

    // 如果 snapshot 没能透传 RAW_TARGET，这里会返回 undefined
    // 在基于 Valtio 的实现中，通常建议对 proxy 使用 toRaw，而非 snapshot
    expect(raw).toEqual(source);
  });

  // 5. 验证普通对象（边缘case）
  it('should return undefined for non-reactive objects', () => {
    const plain = { x: 1 };
    const raw = useToRaw(plain as any);
    expect(raw).toBeUndefined();
  });

  // 6. 验证嵌套解包逻辑
  it('should get raw object from a nested proxy obtained from useReactive', () => {
    const nested = { b: 2 };
    const source = { a: nested };
    const { result: proxyRef } = renderHook(() => useReactive(source));

    // 获取嵌套的 proxy
    const nestedProxy = proxyRef.current.a;
    const rawNested = useToRaw(nestedProxy);

    expect(rawNested).toEqual(nested);
  });
});
