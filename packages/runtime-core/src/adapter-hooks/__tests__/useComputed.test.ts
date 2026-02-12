import { act, renderHook } from '@testing-library/react';
import { useComputed } from '../state/useComputed';
import { useReactive } from '../state/useReactive';

describe('useComputed Advanced Test Suites', () => {
  it('computes lazily and caches until deps change', async () => {
    const getter = jest.fn((count: number) => count * 2);

    const { result } = renderHook(() => {
      const state = useReactive({ count: 1 });
      const computed = useComputed(() => getter(state.count));
      return { state, computed };
    });

    expect(getter).toHaveBeenCalledTimes(0);

    expect(result.current.computed.value).toBe(2);
    expect(getter).toHaveBeenCalledTimes(1);

    expect(result.current.computed.value).toBe(2);
    expect(getter).toHaveBeenCalledTimes(1);

    await act(async () => {
      result.current.state.count = 2;
    });

    expect(result.current.computed.value).toBe(4);
    expect(getter).toHaveBeenCalledTimes(2);
  });

  it('supports writable computed', async () => {
    const { result } = renderHook(() => {
      const state = useReactive({ count: 1 });
      const computed = useComputed({
        get: () => state.count + 1,
        set: (value) => {
          state.count = value - 1;
        },
      });
      return { state, computed };
    });

    expect(result.current.computed.value).toBe(2);

    await act(async () => {
      result.current.computed.value = 10;
    });

    expect(result.current.state.count).toBe(9);
    expect(result.current.computed.value).toBe(10);
  });

  it('warns on write to readonly computed', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    const { result } = renderHook(() => {
      const state = useReactive({ a: { b: 1 } });
      const computed = useComputed(() => state.a.b + 1);
      return { state, computed };
    });

    act(() => {
      (result.current.computed as any).value = 99;
    });

    expect(warnSpy).toHaveBeenCalledWith('Computed value is readonly');
    expect(result.current.state.a.b).toBe(1);

    warnSpy.mockRestore();

    await act(async () => {
      result.current.state.a.b++;
    });

    expect(result.current.computed.value).toBe(3);
  });
});
