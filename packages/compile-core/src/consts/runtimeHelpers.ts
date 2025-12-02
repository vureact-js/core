import { RuntimeComponents, RuntimeHelperTypes, RuntimeUtils } from './enum';

type RuntimeHelpers = Record<'directive', Record<string, RuntimeComponents | RuntimeUtils>>;

export const runtimeHelpers: RuntimeHelpers = {
  directive: {
    'v-on': RuntimeUtils.V_ON,
    'v-once': RuntimeComponents.ONCE,
    'v-memo': RuntimeComponents.MEMO,
    'v-if': RuntimeComponents.IF,
    'v-else': RuntimeComponents.ELSE,
    'v-else-if': RuntimeComponents.ELSE_IF,
  },
};

export const runtimeHelperTypes: Record<string, RuntimeHelperTypes> = {
  'v-on': RuntimeHelperTypes.UTILS,
  'v-once': RuntimeHelperTypes.COMPONENT,
  'v-memo': RuntimeHelperTypes.COMPONENT,
  'v-if': RuntimeHelperTypes.COMPONENT,
  'v-else': RuntimeHelperTypes.COMPONENT,
  'v-else-if': RuntimeHelperTypes.COMPONENT,
};
