export {
  type BaseSimpleNodeIR,
  type FragmentNodeIR,
} from '@src/core/transform/sfc/template/shared/node-ir-utils';
export {
  resolveProps,
  resolveVSlotProp,
  type PropIRValue,
  type PropsIR,
  type SlotPropsIR,
} from './props';
export { resolveCommentNode } from './resolve-comment-node';
export { resolveElementNode, type ElementNodeIR } from './resolve-element-node';
export { resolveInterpolationNode } from './resolve-interpolation-node';
export { resolveSlotOutletNode } from './resolve-slot-outlet-node';
export { resolveTemplateChildren } from './resolve-template-children';
export { resolveTemplateVSlotNode } from './resolve-template-v-slot-node';
export { resolveTextNode } from './resolve-text-node';
