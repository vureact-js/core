import { PACKAGE_NAME } from './other';

export interface AdapterRule {
  /**
   * 目标 API 适配名称
   */
  target: string;

  /**
   * 来自哪个包
   */
  package: string;

  /**
   * API 的返回值是否可被用于依赖追踪
   */
  isTrackable?: boolean;

  /**
   * 处理类型
   */
  type: 'rename' | 'analyzed-deps' | 'none';
}

type AdapterRulesMap = {
  [K in keyof typeof PACKAGE_NAME]: {
    [P: string]: AdapterRule; // 保持灵活性，但需要运行时验证
  };
};

// 适配映射规则
export const ADAPTER_RULES: AdapterRulesMap = {
  // =============== [React] ===============
  react: {
    // =============== Hooks ===============
    useTemplateRef: {
      target: 'useRef',
      package: PACKAGE_NAME.react,
      type: 'none',
    },
    defineExpose: {
      target: 'useImperativeHandle',
      package: PACKAGE_NAME.react,
      type: 'none',
    },
  },

  // ============== [VuReact Runtime Core] ===============
  runtime: {
    // =============== Components ===============
    KeepAlive: {
      target: 'KeepAlive',
      package: PACKAGE_NAME.runtime,
      type: 'rename',
    },
    Suspense: {
      target: 'Suspense',
      package: PACKAGE_NAME.runtime,
      type: 'rename',
    },
    Teleport: {
      target: 'Teleport',
      package: PACKAGE_NAME.runtime,
      type: 'rename',
    },
    Component: {
      target: 'Component',
      package: PACKAGE_NAME.runtime,
      type: 'rename',
    },
    provide: {
      target: 'Provider',
      package: PACKAGE_NAME.runtime,
      type: 'rename',
    },
    Transition: {
      target: 'Transition',
      package: PACKAGE_NAME.runtime,
      type: 'rename',
    },
    TransitionGroup: {
      target: 'TransitionGroup',
      package: PACKAGE_NAME.runtime,
      type: 'rename',
    },

    // =============== Hooks ===============
    useActived: {
      target: 'useActived',
      package: PACKAGE_NAME.runtime,
      type: 'rename',
    },
    useDeactivated: {
      target: 'useDeactivated',
      package: PACKAGE_NAME.runtime,
      type: 'rename',
    },
    onBeforeMount: {
      target: 'useBeforeMount',
      package: PACKAGE_NAME.runtime,
      type: 'rename',
    },
    onBeforeUnMount: {
      target: 'useBeforeUnMount',
      package: PACKAGE_NAME.runtime,
      type: 'rename',
    },
    onMounted: {
      target: 'useMounted',
      package: PACKAGE_NAME.runtime,
      type: 'rename',
    },
    onUnmounted: {
      target: 'useUnmounted',
      package: PACKAGE_NAME.runtime,
      type: 'rename',
    },
    onBeforeUpdate: {
      target: 'useBeforeUpdate',
      package: PACKAGE_NAME.runtime,
      type: 'analyzed-deps',
    },
    onUpdated: {
      target: 'useUpdated',
      package: PACKAGE_NAME.runtime,
      type: 'analyzed-deps',
    },
    ref: {
      target: 'useVRef',
      package: PACKAGE_NAME.runtime,
      type: 'rename',
      isTrackable: true,
    },
    reactive: {
      target: 'useReactive',
      package: PACKAGE_NAME.runtime,
      type: 'rename',
      isTrackable: true,
    },
    computed: {
      target: 'useComputed',
      package: PACKAGE_NAME.runtime,
      type: 'rename',
      isTrackable: true,
    },
    readonly: {
      target: 'useReadonly',
      package: PACKAGE_NAME.runtime,
      type: 'rename',
      isTrackable: true,
    },
    toRef: {
      target: 'useToVRef',
      package: PACKAGE_NAME.runtime,
      type: 'rename',
      isTrackable: true,
    },
    toRefs: {
      target: 'useToVRefs',
      package: PACKAGE_NAME.runtime,
      type: 'rename',
      isTrackable: true,
    },
    toRaw: {
      target: 'useToRaw',
      package: PACKAGE_NAME.runtime,
      type: 'rename',
    },
    inject: {
      target: 'useInject',
      package: PACKAGE_NAME.runtime,
      type: 'rename',
      isTrackable: true,
    },
    shallowRef: {
      target: 'useShallowRef',
      package: PACKAGE_NAME.runtime,
      type: 'rename',
      isTrackable: true,
    },
    shallowReactive: {
      target: 'useShallowReactive',
      package: PACKAGE_NAME.runtime,
      type: 'rename',
      isTrackable: true,
    },
    shallowReadonly: {
      target: 'useShallowReadonly',
      package: PACKAGE_NAME.runtime,
      type: 'rename',
      isTrackable: true,
    },
    isRef: {
      target: 'isRef',
      package: PACKAGE_NAME.runtime,
      type: 'rename',
      isTrackable: true,
    },
    isProxy: {
      target: 'isProxy',
      package: PACKAGE_NAME.runtime,
      type: 'rename',
      isTrackable: true,
    },
    isReactive: {
      target: 'isReactive',
      package: PACKAGE_NAME.runtime,
      type: 'rename',
      isTrackable: true,
    },
    watch: {
      target: 'useWatch',
      package: PACKAGE_NAME.runtime,
      type: 'rename',
    },
    watchEffect: {
      target: 'useWatchEffect',
      package: PACKAGE_NAME.runtime,
      type: 'analyzed-deps',
    },
    watchPostEffect: {
      target: 'useWatchPostEffect',
      package: PACKAGE_NAME.runtime,
      type: 'analyzed-deps',
    },
    watchSyncEffect: {
      target: 'useWatchSyncEffect',
      package: PACKAGE_NAME.runtime,
      type: 'analyzed-deps',
    },

    // =============== Directive Utils ===============
    dir: {
      target: 'dir',
      package: PACKAGE_NAME.runtime,
      type: 'rename',
    },
    dirCls: {
      target: 'dir.cls',
      package: PACKAGE_NAME.runtime,
      type: 'rename',
    },
    dirKeyless: {
      target: 'dir.keyless',
      package: PACKAGE_NAME.runtime,
      type: 'rename',
    },
    dirOn: {
      target: 'dir.On',
      package: PACKAGE_NAME.runtime,
      type: 'rename',
    },
    dirStyle: {
      target: 'dir.style',
      package: PACKAGE_NAME.runtime,
      type: 'rename',
    },
    nextTick: {
      target: 'nextTick',
      package: PACKAGE_NAME.runtime,
      type: 'rename',
    },
  },

  // =================== [VuReact Router] ===================
  router: {
    // =============== Components ===============
    RouterLink: {
      target: 'RouterLink',
      package: PACKAGE_NAME.router,
      type: 'rename',
    },
    RouterView: {
      target: 'RouterView',
      package: PACKAGE_NAME.router,
      type: 'rename',
    },

    createRouter: {
      target: 'createRouter',
      package: PACKAGE_NAME.router,
      type: 'rename',
    },

    // =============== Hooks ===============
    useRoute: {
      target: 'useRoute',
      package: PACKAGE_NAME.router,
      type: 'rename',
      isTrackable: true,
    },
    useRouter: {
      target: 'useRouter',
      package: PACKAGE_NAME.router,
      type: 'rename',
      isTrackable: true,
    },
    useLink: {
      target: 'useLink',
      package: PACKAGE_NAME.router,
      type: 'rename',
      isTrackable: true,
    },
    onBeforeRouteLeave: {
      target: 'useBeforeRouteLeave',
      package: PACKAGE_NAME.router,
      type: 'rename',
    },
    onBeforeRouteUpdate: {
      target: 'useBeforeRouteUpdate',
      package: PACKAGE_NAME.router,
      type: 'rename',
    },
    onBeforeRouteEnter: {
      target: 'useBeforeRouteEnter',
      package: PACKAGE_NAME.router,
      type: 'rename',
    },
  },
} as const;
