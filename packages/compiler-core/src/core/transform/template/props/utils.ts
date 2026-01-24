import { strCodeTypes } from '@shared/string-code-types';
import { camelCase } from '@utils/camelCase';
import { PropsIR, PropTypes } from '.';
import { BabelExp } from '../shared/types';

export function createPropsIR(rawName: string, name: string, content: string): PropsIR {
  return {
    type: PropTypes.DYNAMIC_ATTRIBUTE,
    name: normalizePropName(rawName, name),
    rawName,
    isStatic: true,
    value: {
      content,
      isStringLiteral: false,
      babelExp: {} as BabelExp,
    },
    babelExp: {} as BabelExp,
  };
}

function normalizePropName(rawName: string, name: string): string {
  if (rawName === 'v-for') return name;

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
