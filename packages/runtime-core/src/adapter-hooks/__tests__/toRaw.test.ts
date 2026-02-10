import { act, renderHook } from '@testing-library/react';
import { toRaw } from '../shared/toRaw';
import { useReactive } from '../state/useReactive';

describe('toRaw Advanced Test Suites', () => {
  it('should return the original object from proxies created by useReactive', async () => {
    const source = { count: 1 };
    const { result } = renderHook(() => useReactive(source));
    const raw = toRaw(result.current);

    expect(result.current).not.toEqual(source);
    expect(raw).not.toEqual(result.current);
    expect(raw).toEqual(source);

    await act(async () => {
      result.current.count++;
    });

    expect(raw).not.toEqual(result.current);
  });
});
