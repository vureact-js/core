export const enum RuntimeModules {
  REACT = 'react',
  VUREACT_RUNTIME = '@vureact/runtime',
}

export const VuR_Runtime = {
  // prop utils
  vOn: 'vOn',
  vBind: 'vBind',
  vBindCls: 'vBindCls',
  vBindStyle: 'vBindStyle',

  // built-in components
  KeepAlive: 'KeepAlive',
  Suspense: 'Suspense',
  TransitionGroup: 'TransitionGroup',
  Transition: 'Transition',
  Teleport: 'Teleport',
  Component: 'Component',

  // hooks
  useBeforeMount: 'useBeforeMount',
  useBeforeUnMount: 'useBeforeUnMount',
  useBeforeUpdate: 'useBeforeUpdate',
  useMounted: 'useMounted',
  useReadonly: 'useReadonly',
  useShallowReadonly: 'useShallowReadonly',
  useShallowState: 'useShallowState',
  useState$: 'useState$',
  useUnmounted: 'useUnmounted',
  useUpdated: 'useUpdated',
  useWatch: 'useWatch',
  useWatchEffect: 'useWatchEffect',
  useWatchPostEffect: 'useWatchPostEffect',
  useWatchSyncEffect: 'useWatchSyncEffect',
  nextTick: 'nextTick',
} as const;

export const React_Hooks = {
  useRef: 'useRef',
  useMemo: 'useMemo',
  useCallback: 'useCallback',
} as const;
