import { act, renderHook } from '@testing-library/react';
import { useReactive } from '../state/useReactive';
import { useToRaw } from '../state/useToRaw';

describe('useToRaw Advanced Test Suites', () => {
  it('should return the original object from proxies created by useReactive', async () => {
    const source = { count: 1 };
    const { result } = renderHook(() => useReactive(source));
    const raw = useToRaw(result.current);

    expect(result.current).not.toEqual(source);
    expect(raw).not.toEqual(result.current);
    expect(raw).toEqual(source);

    await act(async () => {
      result.current.count++;
    });

    expect(raw).not.toEqual(result.current);
  });
});
