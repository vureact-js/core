export const ADAPTER_COMPS = {
  KeepAlive: 'KeepAlive',
  Suspense: 'Suspense',
  Teleport: 'Teleport',
  Component: 'Component',
  Provider: 'Provider', // 实际是 Vue 的 provide 方法，为了命名统一采用 Provide
  Transition: 'Transition',
  TransitionGroup: 'TransitionGroup',
} as const;

export const ADAPTER_HOOKS = {
  /**
   * 这类 api 在适配时百分百确定仅需替换调用名，无需其他处理。
   * 具体由对应适配 api 完全模拟实现
   */
  simple: {
    ref: 'useRefState',
    reactive: 'useReactive',
    computed: 'useComputed',
    readonly: 'useReadonly',
    toRef: 'useToRefState',
    toRefs: 'useToRefStates',
    toRaw: 'useToRaw',
    isRef: 'isRef',
    isProxy: 'isProxy',
    isReactive: 'isReactive',
    inject: 'useInject',
    watch: 'useWatch',
    shallowRef: 'useShallowRef',
    shallowReactive: 'useShallowReactive',
    shallowReadonly: 'useShallowReadonly',
    lifecycle: {
      onBeforeMount: 'useBeforeMount',
      onBeforeUnMount: 'useBeforeUnMount',
      onBeforeUpdate: 'useBeforeUpdate',
      onMounted: 'useMounted',
      onUnmounted: 'useUnmounted',
      onUpdated: 'useUpdated',
    },
    useActived: 'useActived',
    useDeactivated: 'useDeactivated',
  },

  /**
   * 这类 api 不仅替换调用名，还需例如收集依赖，并增加新参数项等。
   */
  complex: {
    useTemplateRef: 'useRef',
    watchEffect: {
      watchEffect: 'useWatchEffect',
      watchPostEffect: 'useWatchPostEffect',
      watchSyncEffect: 'useWatchSyncEffect',
    },
  },
} as const;

export const ADAPTER_UTILS_MAP = {
  dir: 'dir',
  dirCls: 'dir.cls',
  dirKeyless: 'dir.keyless',
  dirOn: 'dir.on',
  dirStyle: 'dir.style',
  nextTick: 'nextTick',
} as const;
