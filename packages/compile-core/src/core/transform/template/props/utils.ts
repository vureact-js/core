import { RuntimeHelper } from '@core/transform/types';
import { vueAttrToReactProp } from '@utils/vueAttrToReactProp';
import { PropsIR, PropTypes } from '.';

export function createPropsIR(
  rawName: string,
  name: string,
  content: string,
  valueIsStatic = true,
): PropsIR {
  return {
    type: PropTypes.ATTRIBUTE,
    name: rawName !== 'v-for' ? vueAttrToReactProp(name) : name,
    rawName,
    isStatic: true,
    value: {
      content: normalizeValue(content ?? 'true', valueIsStatic),
      isBabelParseExp: true,
    },
    runtimeHelper: {} as RuntimeHelper['runtimeHelper'],
  };
}

export function normalizeValue(value: string, isStatic: boolean): string {
  return isStatic && value !== 'true' && value !== 'false' ? `'${value}'` : value;
}

export function isVOn(name?: string): boolean {
  return /^@|^v-on:/.test(name ?? '');
}

export function isVSlot(name?: string): boolean {
  return /^#|^v-slot/.test(name ?? '');
}

export function isVBind(name?: string): boolean {
  return /^:|^v-bind/.test(name ?? '');
}

export function isVModel(name?: string): boolean {
  return /^v-model/.test(name ?? '');
}

export function isClassAttr(name?: string): boolean {
  return /^(class|:class|v-bind:class|className)$/.test(name ?? '');
}

export function isStyleAttr(name?: string): boolean {
  return /^(style|:style|v-bind:style)$/.test(name ?? '');
}
