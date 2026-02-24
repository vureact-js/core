export const ADAPTER_COMPS = {
  KeepAlive: 'KeepAlive',
  Suspense: 'Suspense',
  Teleport: 'Teleport',
  Component: 'Component',
  Provider: 'Provider', // 实际是 Vue 的 provide 方法，为了命名统一采用 Provide
  Transition: 'Transition',
  TransitionGroup: 'TransitionGroup',
} as const;

export interface ADAPTER_API {
  /**
   * 这类 api 在适配时百分百确定仅需替换调用名，无需其他处理。
   * 具体由对应适配 api 完全模拟实现
   */
  simple: {
    /**
     * 正常/通用的 API。其返回值没有此副作用：被作为依赖收集的目标
     */
    standard: Record<string, any>;
    /**
     * 调用其 API 且返回值需要被作为依赖收集目标的
     */
    reactive: Record<string, any>;
  };

  /**
   * 这类 api 不仅替换调用名，还需例如收集依赖，并增加新参数项等。
   */
  complex: ADAPTER_API['simple'];
}

export const ADAPTER_HOOKS: ADAPTER_API = {
  simple: {
    standard: {
      useActived: 'useActived',
      useDeactivated: 'useDeactivated',
      onBeforeMount: 'useBeforeMount',
      onBeforeUnMount: 'useBeforeUnMount',
      onMounted: 'useMounted',
      onUnmounted: 'useUnmounted',
    },

    reactive: {
      ref: 'useVRef',
      reactive: 'useReactive',
      computed: 'useComputed',
      readonly: 'useReadonly',
      toRef: 'useToVRef',
      toRefs: 'useToVRefs',
      toRaw: 'useToRaw',
      inject: 'useInject',
      watch: 'useWatch',
      shallowRef: 'useShallowRef',
      shallowReactive: 'useShallowReactive',
      shallowReadonly: 'useShallowReadonly',
      isRef: 'isRef',
      isProxy: 'isProxy',
      isReactive: 'isReactive',
    },
  },

  complex: {
    standard: {
      useTemplateRef: 'useRef',
      watchEffect: {
        watchEffect: 'useWatchEffect',
        watchPostEffect: 'useWatchPostEffect',
        watchSyncEffect: 'useWatchSyncEffect',
      },
      lifecycle: {
        onBeforeUpdate: 'useBeforeUpdate',
        onUpdated: 'useUpdated',
      },
    },

    reactive: {},
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

export const ADAPTER_ROUTER_COMPS = {
  RouterLink: 'RouterLink',
  RouterView: 'RouterView',
} as const;

export const ADAPTER_ROUTER_APIS: ADAPTER_API = {
  simple: {
    standard: {
      createRouter: 'createRouter',
      onBeforeRouteLeave: 'useBeforeRouteLeave',
      onBeforeRouteUpdate: 'useBeforeRouteUpdate',
      onBeforeRouteEnter: 'useBeforeRouteEnter',
    },

    reactive: {
      useRoute: 'useRoute',
      useRouter: 'useRouter',
      useLink: 'useLink',
    },
  },

  complex: {
    standard: {},
    reactive: {},
  },
} as const;
