export const enum RuntimeModules {
  RUNTIME = 'vureact-runtime',
  RV3_HOOKS = 'react-vue3-hooks',
  RV3_COMPONENTS = 'react-vue3-components',
}

export const VR_Runtime = {
  vOn: 'vOn',
  vBind: 'vBind',
  vBindCls: 'vBindCls',
  vBindStyle: 'vBindStyle',
} as const;

export const RV3_Components = {
  KeepAlive: 'KeepAlive',
  Suspense: 'Suspense',
  TransitionGroup: 'TransitionGroup',
  Transition: 'Transition',
  Teleport: 'Teleport',
  Component: 'Component',
} as const;

export const RV3_HOOKS = {
  useBeforeMount: 'useBeforeMount',
  useBeforeUnMount: 'useBeforeUnMount',
  useBeforeUpdate: 'useBeforeUpdate',
  useMounted: 'useMounted',
  useReadonly: 'useReadonly',
  useShallowReadonly: 'useShallowReadonly',
  useShallowState: 'useShallowState',
  $useState: '$useState',
  useUnmounted: 'useUnmounted',
  useUpdated: 'useUpdated',
  useWatch: 'useWatch',
  useWatchEffect: 'useWatchEffect',
} as const;
