import { ReactElement } from 'react';
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

export function getComponentName(el: ReactElement): string | null {
  const type: any = el.type;
  return type.displayName || type.name || null;
}
