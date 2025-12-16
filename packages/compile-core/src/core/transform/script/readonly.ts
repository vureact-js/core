import { RV3_HOOKS } from '@consts/runtimeModules';
import { ScriptBlockIR } from '.';

const ADAPT_APIS = {
  readonly: RV3_HOOKS.useReadonly,
  shallowReadonly: RV3_HOOKS.useShallowReadonly,
} as const;

export function transformReadonly(ast: ScriptBlockIR) {}
