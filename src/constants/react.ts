import { VUE_LIFECYCLE_HOOKS, VUE_REACTIVE_APIS } from './vue';

export const REACT = 'react';

/* third party packages */
export const enum THIRD_PARTY {
  // to replace useState
  useImmer = 'use-immer',
  // more convenient hooks. https://streamich.github.io/react-use
  reactUse = 'react-use',
  // DO NOT use <React.StrictMode />
  // (React v18+) DO NOT use ReactDOMClient.createRoot, use ReactDOM.render instead
  // or You can disable autoFreeze to work with createRoot though this may result in performance loss
  // import { KeepAlive } from 'react-activation'
  // KeepAlive.defautProps.autoFreeze = false // default 'true'
  // emulating Vue's <KeepAlive>. https://github.com/CJY0208/react-activation
  reactActivation = 'react-activation',
}

export const REACT_HOOKS = {
  useState: 'useState',
  useMemo: 'useMemo',
  useEffect: 'useEffect',
  useCallback: 'useCallback',
  useLayoutEffect: 'useLayoutEffect',
};

/* from use-immer package */
export const USE_IMMER = 'useImmer';

/* from react-use package */
export const REACT_USE = {
  useAsync: 'useAsync',
  useMount: 'useMount',
  useUnmount: 'useUnmount',
  useUpdateEffect: 'useUpdateEffect',
  useEffectOnce: 'useEffectOnce',
  useDeepCompareEffect: 'useDeepCompareEffect',
  useFirstMountState: 'useFirstMountState',
};

/* from react-activation package */
export const REACT_ACTIVATION = {
  useActivate: 'useActivate',
  useUnactivate: 'useUnactivate',
};

export const VUE_TO_REACT_HOOKS = {
  [VUE_REACTIVE_APIS.ref]: USE_IMMER,
  [VUE_REACTIVE_APIS.reactive]: USE_IMMER,
  [VUE_REACTIVE_APIS.shallowRef]: USE_IMMER,
  [VUE_REACTIVE_APIS.shallowReactive]: USE_IMMER,
  [VUE_REACTIVE_APIS.toRef]: USE_IMMER,
  [VUE_REACTIVE_APIS.toRefs]: USE_IMMER,
  [VUE_REACTIVE_APIS.computed]: REACT_HOOKS.useMemo,
  [VUE_REACTIVE_APIS.readonly]: REACT_HOOKS.useMemo,
  [VUE_REACTIVE_APIS.watch]: REACT_USE.useUpdateEffect,
  [VUE_REACTIVE_APIS.watchEffect]: REACT_HOOKS.useEffect,

  [VUE_LIFECYCLE_HOOKS.beforeMount]: REACT_USE.useMount,
  [VUE_LIFECYCLE_HOOKS.mounted]: REACT_USE.useMount,
  [VUE_LIFECYCLE_HOOKS.beforeUpdate]: REACT_HOOKS.useLayoutEffect,
  [VUE_LIFECYCLE_HOOKS.updated]: REACT_USE.useUpdateEffect,
  [VUE_LIFECYCLE_HOOKS.beforeUnmount]: REACT_USE.useUnmount,
  [VUE_LIFECYCLE_HOOKS.unmounted]: REACT_USE.useUnmount,
  [VUE_LIFECYCLE_HOOKS.activated]: REACT_ACTIVATION.useActivate,
  [VUE_LIFECYCLE_HOOKS.deactivated]: REACT_ACTIVATION.useUnactivate,
};
