import { VUE_LIFECYCLE_HOOKS, VUE_REACTIVE_APIS } from './vue';

export const REACT = 'react';

export const EDDIE_REACT_DEPS = '@eddie/react-dependencies';

export const REACT_HOOKS = {
  useState: 'useState',
  useMemo: 'useMemo',
  useEffect: 'useEffect',
  useCallback: 'useCallback',
  useLayoutEffect: 'useLayoutEffect',
};

/** 编译后 React 所需的第三方依赖包的 api 合集 */
export const REACT_DEPS = {
  useImmer: 'useImmer',
  useAsync: 'useAsync',
  useMount: 'useMount',
  useUnmount: 'useUnmount',
  useUpdateEffect: 'useUpdateEffect',
  useEffectOnce: 'useEffectOnce',
  useDeepCompareEffect: 'useDeepCompareEffect',
  useFirstMountState: 'useFirstMountState',
  useActivated: 'useActivated',
  useDeactivated: 'useDeactivated',
};

export const VUE_TO_REACT_HOOKS = {
  [VUE_REACTIVE_APIS.ref]: REACT_HOOKS.useState,
  [VUE_REACTIVE_APIS.reactive]: REACT_DEPS.useImmer,
  [VUE_REACTIVE_APIS.shallowRef]: REACT_HOOKS.useState,
  [VUE_REACTIVE_APIS.shallowReactive]: REACT_HOOKS.useState,
  [VUE_REACTIVE_APIS.toRef]: REACT_DEPS.useImmer,
  [VUE_REACTIVE_APIS.toRefs]: REACT_DEPS.useImmer,
  [VUE_REACTIVE_APIS.computed]: REACT_HOOKS.useMemo,
  [VUE_REACTIVE_APIS.readonly]: REACT_HOOKS.useMemo,
  [VUE_REACTIVE_APIS.watch]: REACT_DEPS.useUpdateEffect,
  [VUE_REACTIVE_APIS.watchEffect]: REACT_HOOKS.useEffect,

  [VUE_LIFECYCLE_HOOKS.beforeMount]: REACT_DEPS.useMount,
  [VUE_LIFECYCLE_HOOKS.mounted]: REACT_DEPS.useMount,
  [VUE_LIFECYCLE_HOOKS.beforeUpdate]: REACT_HOOKS.useLayoutEffect,
  [VUE_LIFECYCLE_HOOKS.updated]: REACT_DEPS.useUpdateEffect,
  [VUE_LIFECYCLE_HOOKS.beforeUnmount]: REACT_DEPS.useUnmount,
  [VUE_LIFECYCLE_HOOKS.unmounted]: REACT_DEPS.useUnmount,
  [VUE_LIFECYCLE_HOOKS.activated]: REACT_DEPS.useActivated,
  [VUE_LIFECYCLE_HOOKS.deactivated]: REACT_DEPS.useDeactivated,
};
