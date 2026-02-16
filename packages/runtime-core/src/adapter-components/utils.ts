import { FunctionComponent, isValidElement, ReactElement } from 'react';

/**
 * Resolve the runtime kind of a React render target.
 */
export function getReactType(param: any): 'component' | 'element' | 'text' | 'other' {
  if (typeof param === 'string') {
    return 'text';
  }

  if (isValidElement(param)) {
    return 'element';
  }

  if (
    typeof param === 'function' ||
    param?.prototype?.isReactComponent ||
    (typeof param === 'object' && param !== null && '$$typeof' in param)
  ) {
    return 'component';
  }

  return 'other';
}

export function getComponentName(el: ReactElement | FunctionComponent): string | null {
  const type = (el as ReactElement).type as FunctionComponent;
  return type.displayName || type.name || (el as FunctionComponent).name || null;
}

export function isPromise(obj: any): obj is Promise<any> {
  return (
    !!obj &&
    (typeof obj === 'object' || typeof obj === 'function') &&
    typeof obj.then === 'function'
  );
}
