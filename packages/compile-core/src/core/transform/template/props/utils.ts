import { strCodeTypes } from '@src/shared/string-code-types';
import { vueAttrToReactProp } from '@utils/vueAttrToReactProp';
import { PropsIR, PropTypes } from '.';

export function createPropsIR(rawName: string, name: string, content: string): PropsIR {
  return {
    type: PropTypes.DYNAMIC_ATTRIBUTE,
    name: rawName !== 'v-for' ? vueAttrToReactProp(name) : name,
    rawName,
    isStatic: true,
    value: {
      content,
      isStringLiteral: false,
      babelExp: {
        content: '',
        // @ts-ignore
        ast: {},
      },
    },
  };
}

export function normalizeValue(value: string, isStatic: boolean): string {
  if (strCodeTypes.isStringLiteral(value)) return value;
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

export function isVConditional(name?: string): boolean {
  return /v-if|v-else|v-else-if/.test(name ?? '');
}
