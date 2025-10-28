export const REACTIVE_TYPE = {
  ref: 'ref',
  reactive: 'reactive',
  computed: 'computed',
  watch: 'watch',
  watchEffect: 'watchEffect',
  toRef: 'toRef',
  toRefs: 'toRefs',
  readonly: 'readonly',
  shallowRef: 'shallowRef',
  shallowReactive: 'shallowReactive',
  shallowReadonly: 'shallowReadonly',
  defineProps: 'defineProps',
  defineEmits: 'defineEmits',
};

export const VUE_LIFECYCLE_HOOKS = {
  beforeMount: 'beforeMount',
  mounted: 'mounted',
  beforeUpdate: 'beforeUpdate',
  updated: 'updated',
  beforeUnmount: 'beforeUnmount',
  unmounted: 'unmounted',
  activated: 'activated',
  deactivated: 'deactivated',
  errorCaptured: 'errorCaptured',
};

type VUE_REACTIVE_APIS = {
  ref: string;
  computed: string;
  reactive: string;
  toRef: string;
  toRefs: string;
  watch: string;
  watchEffect: string;
  readonly: string;
  shallowRef: string;
  shallowReactive: string;
  defineProps: string;
  defineEmits: string;
};

export const VUE_REACTIVE_APIS: VUE_REACTIVE_APIS = {
  ref: REACTIVE_TYPE.ref,
  computed: REACTIVE_TYPE.computed,
  reactive: REACTIVE_TYPE.reactive,
  toRef: REACTIVE_TYPE.toRef,
  toRefs: REACTIVE_TYPE.toRefs,
  watch: REACTIVE_TYPE.watch,
  watchEffect: REACTIVE_TYPE.watchEffect,
  readonly: REACTIVE_TYPE.readonly,
  shallowRef: REACTIVE_TYPE.shallowRef,
  shallowReactive: REACTIVE_TYPE.shallowReactive,
  defineProps: REACTIVE_TYPE.defineProps,
  defineEmits: REACTIVE_TYPE.defineEmits,
};

/**
 * Vue -> React 常见 prop 映射表
 * 主要是一些 DOM 属性在 React 里的特例
 */
export const VUE_TO_REACT_PROP_MAP: Record<string, string> = {
  class: 'className',
  for: 'htmlFor',
  tabindex: 'tabIndex',
  readonly: 'readOnly',
  maxlength: 'maxLength',
  minlength: 'minLength',
  contenteditable: 'contentEditable',
  spellcheck: 'spellCheck',
  autofocus: 'autoFocus',
  autocomplete: 'autoComplete',
  colspan: 'colSpan',
  rowspan: 'rowSpan',
  frameborder: 'frameBorder',
  usemap: 'useMap',
  srcset: 'srcSet',
  acceptcharset: 'acceptCharset',
  novalidate: 'noValidate',
  formnovalidate: 'formNoValidate',
  allowfullscreen: 'allowFullScreen',
  crossorigin: 'crossOrigin',
  'accept-charset': 'acceptCharset',
  'http-equiv': 'httpEquiv',
};

export const VUE_BUILT_IN_COMPS = {
  Transition: 'Transition',
  TransitionGroup: 'TransitionGroup',
  KeepAlive: 'KeepAlive',
  Teleport: 'Teleport',
  Suspense: 'Suspense',
  Component: 'Component',
};

export const VUE_EV_MODIF = {
  capture: 'capture',
  left: 'left',
  middle: 'middle',
  once: 'once',
  passive: 'passive',
  prevent: 'prevent',
  right: 'right',
  self: 'self',
  stop: 'stop',
};

export const VUE_KEY_MODIF: Record<string, string> = {
  enter: 'Enter',
  esc: 'Escape',
  tab: 'Tab',
  space: ' ',
  up: 'ArrowUp',
  down: 'ArrowDown',
  left: 'ArrowLeft',
  right: 'ArrowRight',
};

export const VUE_DIR = {
  is: 'is',
  if: 'if',
  elseIf: 'else-if',
  else: 'else',
  for: 'for',
  once: 'once',
  memo: 'memo',
  text: 'text',
  show: 'show',
  bind: 'bind',
  on: 'on',
  model: 'model',
  html: 'html',
  slot: 'slot',
  pre: 'pre',
  // 替代 pre / Replace pre
  skip: 'skip',
  cloak: 'cloak',
};
