import * as t from '@babel/types';

export type ReactiveTypes =
  | 'ref'
  | 'shallowRef'
  | 'reactive'
  | 'shallowReactive'
  | 'computed'
  | 'readonly'
  | 'shallowReadonly';

export function markReactive(node: t.Node, type: ReactiveTypes = 'ref') {
  const arr = type.replace('shallow', '').split('');
  arr[0] = arr[0]!.toLowerCase();
  (node as any).__reactiveType = arr.join('');
}

export function getIsReactive(node: t.Node, type: ReactiveTypes): boolean {
  return (node as any).__reactiveType === type;
}
