import { camelCase } from './camelCase';

export const vueAttrToReactProp = (name: string): string => {
  switch (name) {
    case 'v-html':
      return 'dangerouslySetInnerHTML';

    case 'class':
      return 'className';

    case 'for':
      return 'htmlFor';

    case 'model':
    case 'modelvalue':
      // 对于 v-model 或 v-model:modelValue，通常在 React 中是 'value' + 'onChange' 的组合
      // 这里统一返回 'value'，事件部分需要单独处理。
      return 'value';

    default:
      return camelCase(name);
  }
};
