<script setup lang="ts">
// @ts-nocheck
import {
  computed,
  ref,
  type AllowedComponentProps,
  type ComponentCustomProps,
  type ComponentOptionsMixin,
  type ComponentPublicInstance,
  type DefineComponent,
  type DirectiveBinding,
  type ExtractPropTypes,
  type PropsDefinition,
  type Ref,
  type SetupContext,
  type VNode,
  type VNodeProps,
} from 'vue';

// 定义 props 类型（复杂嵌套）
interface NestedProps {
  data: {
    user: {
      name: string;
      age: Ref<number>;
      address: {
        city: string;
        zip: string;
      };
    };
    items: Array<{
      id: number;
      label: string;
      meta: Record<string, unknown>;
    }>;
  };
  config: {
    theme: 'light' | 'dark';
    options: string[];
    callback: (value: string) => void;
  };
}

// 定义 emits 类型
interface NestedEmits {
  (e: 'update', payload: { id: number; value: string }): void;
  (e: 'delete', payload: { id: number }): void;
  (e: 'custom-event', detail: { type: string; data: unknown }): void;
}

// 定义 slots 类型（复杂嵌套）
interface NestedSlots {
  default(props: { item: { id: number; label: string }; index: number }): VNode[];
  header(props: { title: string }): VNode[];
  footer(): VNode[];
}

type Wmoawd = NestedProps | (VNodeProps & ComponentCustomProps) | NestedEmits;

// 定义组件 props 的类型提取
const nestedPropsDefinition = {
  data: {
    type: Object as () => NestedProps['data'],
    required: true,
  },
  config: {
    type: Object as () => NestedProps['config'],
    default: () => ({
      theme: 'light' as const,
      options: [],
      callback: (val: string) => console.log(val),
    }),
  },
} satisfies PropsDefinition;

type NestedPropsResult = ExtractPropTypes<typeof nestedPropsDefinition>;

// 创建一个复杂类型的组件实例引用
let complexComponentRef: Ref<DefineComponent<
  NestedProps,
  {},
  {},
  {},
  {},
  ComponentOptionsMixin,
  ComponentOptionsMixin,
  NestedEmits,
  string,
  ComponentPublicInstance<NestedProps, {}, {}, {}, {}, NestedEmits, NestedSlots>,
  NestedProps,
  NestedEmits
> | null> = ref(null);

// 创建指令绑定类型（复杂嵌套）
let directiveBinding: DirectiveBinding<{
  handler: (event: MouseEvent, data: { x: number; y: number }) => void;
  options: {
    debounce: number;
    throttle: boolean;
  };
  modifiers: {
    stop: boolean;
    prevent: boolean;
    self: boolean;
  };
}> = {
  value: null as any,
  oldValue: null as any,
  arg: null,
  modifiers: { stop: false, prevent: false, self: false },
  dir: undefined as any,
  instance: undefined as any,
};

// 使用 SetupContext（复杂嵌套）
let setupContext: SetupContext<NestedEmits, NestedSlots> = {
  attrs: {},
  slots: {
    default: () => [],
    header: () => [],
    footer: () => [],
  },
  emit: (e: any, ...args: any[]) => {},
  expose: (exposed?: Record<string, any>) => {},
};

// 创建 VNode 类型引用
let vnode: VNode = {
  __v_isVNode: true,
  __v_skip: true,
  type: 'div',
  props: {
    class: 'complex-node',
    style: { color: 'red' },
  } as VNodeProps & AllowedComponentProps & ComponentCustomProps,
  key: null,
  ref: null,
  children: [],
  component: null,
  el: null,
  anchor: null,
  dynamicProps: null,
  dynamicChildren: null,
  patchFlag: 0,
  shapeFlag: 0,
  dirs: null,
  transition: null,
};

// 使用所有类型声明
let result = computed(() => ({
  complexComponent: complexComponentRef.value,
  directive: directiveBinding,
  context: setupContext,
  node: vnode,
  props: [] as NestedPropsResult[],
}));
</script>
