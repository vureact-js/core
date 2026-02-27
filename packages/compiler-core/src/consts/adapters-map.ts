export const ADAPTER_COMPS = {
  KeepAlive: 'KeepAlive',
  Suspense: 'Suspense',
  Teleport: 'Teleport',
  Component: 'Component',
  Provider: 'Provider', // 实际是 Vue 的 provide 方法，为了命名统一采用 Provide
  Transition: 'Transition',
  TransitionGroup: 'TransitionGroup',
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

/**
 * 编译器API适配规则
 */
export interface CompilerAdapterRules {
  /**
   * 仅需替换调用名的简单适配
   */
  renameOnly: ApiBehavior;

  /**
   * 需要额外处理（如收集依赖、添加参数等）的复杂适配
   */
  transform: ApiBehavior;
}

/**
 * API调用行为分类
 */
export type ApiBehavior = {
  /**
   * 纯API：调用无副作用，返回值不参与依赖收集
   */
  pure: Record<string, any>;

  /**
   * 有副作用的API：调用有副作用，返回值需要作为依赖收集目标
   */
  effectful: Record<string, any>;
};

export const ADAPTER_HOOKS: CompilerAdapterRules = {
  renameOnly: {
    pure: {
      useActived: 'useActived',
      useDeactivated: 'useDeactivated',
      onBeforeMount: 'useBeforeMount',
      onBeforeUnMount: 'useBeforeUnMount',
      onMounted: 'useMounted',
      onUnmounted: 'useUnmounted',
    },

    effectful: {
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

  transform: {
    pure: {
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

    effectful: {},
  },
} as const;

export const ADAPTER_ROUTER_APIS: CompilerAdapterRules = {
  renameOnly: {
    pure: {
      createRouter: 'createRouter',
      onBeforeRouteLeave: 'useBeforeRouteLeave',
      onBeforeRouteUpdate: 'useBeforeRouteUpdate',
      onBeforeRouteEnter: 'useBeforeRouteEnter',
    },

    effectful: {
      useRoute: 'useRoute',
      useRouter: 'useRouter',
      useLink: 'useLink',
    },
  },

  transform: {
    pure: {},
    effectful: {},
  },
} as const;
