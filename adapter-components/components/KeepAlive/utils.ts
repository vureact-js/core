import { EddieKeepAliveProps } from '.';

export function matchPattern(pattern: EddieKeepAliveProps['include'], key: string | null): boolean {
  if (!pattern || !key) return false;
  if (Array.isArray(pattern)) return pattern.some((p) => matchPattern(p, key));
  if (typeof pattern === 'string')
    return pattern
      .split(',')
      .map((s) => s.trim())
      .some((p) => p === key);
  return (pattern as RegExp).test(key);
}
