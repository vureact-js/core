export const PACKAGE_NAME = {
  react: 'react',
  runtime: '@vureact/runtime-core',
};

/** 函数组件的 props 参数名 */
export const COMP_PROPS_NAME = '$$props';

/** defineEmits 对应变量名 */
export const EMITS_API_VAR_NAME = '$$emits';

/** defineSlots 对应变量名 */
export const SLOTS_API_VAR_NAME = '$$slots';

/** 导入 style 模块所有使用的别名 */
export const STYLE_MODULE_NAME = '$$style';

/** 需要通过 .value 访问的响应式 API 集合 */
export const VALUE_ACCESS_REACTIVE_APIS = new Set([
  'ref',
  'toRef',
  'customRef',
  'shallowRef',
  'computed',
]);
