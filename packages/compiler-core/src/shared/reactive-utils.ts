import { REACTIVE_TYPE_MAP } from '@consts/reactive-type-map';

export type ReactiveTypes = 'ref' | 'reactive' | 'indirect' | 'none';

export function getReactiveType(originalName: string): ReactiveTypes {
  return REACTIVE_TYPE_MAP[originalName as keyof typeof REACTIVE_TYPE_MAP] || 'none';
}

/**
 * 获取 Vue 的所有用于创建带有响应式状态的 api 名
 */
export function getReactiveStateApis(): Set<string> {
  return new Set(Object.keys(REACTIVE_TYPE_MAP));
}
