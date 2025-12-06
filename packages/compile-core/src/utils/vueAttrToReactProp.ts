import { camelCase } from './camelCase';

export const vueAttrToReactProp = (name: string): string => {
  const whitelist = /^data-|datatype|^aria-/;

  switch (name) {
    case 'v-html':
      return 'dangerouslySetInnerHTML';

    case 'class':
      return 'className';

    case 'for':
      return 'htmlFor';

    default:
      return whitelist.test(name) ? name : camelCase(name);
  }
};
