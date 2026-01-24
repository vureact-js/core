export const enum RuntimeModules {
  REACT = 'react',
  VUREACT_RUNTIME = '@vureact/runtime-core',
}

export const VuR_Runtime = {
  // adapter-utils
  dir: 'dir',
  nextTick: 'nextTick',

  // adapter-components
  KeepAlive: 'KeepAlive',
  Suspense: 'Suspense',
  TransitionGroup: 'TransitionGroup',
  Transition: 'Transition',
  Teleport: 'Teleport',
  Component: 'Component',
  CtxProvider: 'CtxProvider',

  // adapter-components/hooks
  useActived: 'useActived',
  useDeactived: 'useDeactived',
  useCtx: 'useCtx',

  // adapter-hooks
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
} as const;

export const ReactApis = {
  useRef: 'useRef',
  useMemo: 'useMemo',
  useCallback: 'useCallback',
  lazy: 'lazy',
} as const;
