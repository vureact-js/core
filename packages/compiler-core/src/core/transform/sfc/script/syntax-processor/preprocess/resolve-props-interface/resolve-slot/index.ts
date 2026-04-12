export { resolveDefineSlotsIface } from './define-slots';
export { resolveTemplateSlotIface } from './template-slots';
export { resolveSlotType } from './type-resolver';
export { buildSlotPropSignature, createSlotScopeParam } from './slot-builder';
export { collectLocalTypeDeclarations, resolvePropName, recordReactNode, resolveCallableType } from './utils';
export type {
  ILocalTypeDeclaration,
  ISlotTypeResolveOptions,
  ISlotTypeResolveResult,
  ISlotMemberResolveResult,
} from './types';