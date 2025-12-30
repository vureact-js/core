import { renderHook } from '@testing-library/react';
import { useReadonly } from '../state/useReadonly';

describe('useReadonly test suites', () => {
  const obj = {
    a: 1,
    b: { c: 2 },
    d: [3],
    e: new Set(),
    f: new Map(),
  };

  it('modifying the entire object should not be allowed.', () => {
    const { result } = renderHook(() => useReadonly(obj));

    expect(result).not.toEqual(obj);

    expect(() => {
      // @ts-ignore
      result.current.a = 2;
      // @ts-ignore
      result.current.c = 3;
    }).toThrow();

    expect(() => {
      result.current.d.pop();
      result.current.e.add(1);
      result.current.f.set('a', 'b');
    }).toThrow();
  });

  it('modifying shallow objects should not be allowed, but nested sub-objects can be modified.', () => {
    const { result } = renderHook(() => useReadonly(obj, true));

    expect(() => {
      // @ts-ignore
      result.current.a = 2;
    }).toThrow();

    expect(() => {
      result.current.d.pop();
      result.current.e.add(1);
      result.current.f.set('a', 'b');
    }).not.toThrow();

    expect(result.current.d).toHaveLength(0);
    expect(result.current.e.size).toBe(1);
    expect(result.current.f.size).toBe(1);
  });
});
