export const PACKAGE_NAME = {
  react: 'react',
  runtime: '@vureact/runtime-core',
  router: '@vureact/router',
} as const;

/** 导入 style 模块所有使用的别名 */
export const STYLE_MODULE_NAME = '$style';

/** Vue3 宏 API 名 */
export const MACRO_API_NAMES = {
  props: 'defineProps',
  emits: 'defineEmits',
  slots: 'defineSlots',
  options: 'defineOptions',
};

/** Vue3 最常用、最核心的 $ 标识符 */
export const DOLLAR_IDENTIFIERS = [
  '$data',
  '$props',
  '$el',
  '$options',
  '$parent',
  '$root',
  '$slots',
  '$refs',
  '$attrs',
  '$emit',
  '$watch',
  '$forceUpdate',
  '$nextTick',
  '$router',
  '$route',
  '$store',
  '$pinia',
  '$event',
];
