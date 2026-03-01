import * as t from '@babel/types';
import { ICompilationContext } from '@compiler/context/types';
import { ADAPTER_UTILS_MAP } from '@consts/adapters-map';
import { PACKAGE_NAME, STYLE_MODULE_NAME } from '@consts/other';
import { logger } from '@shared/logger';
import { strCodeTypes } from '@shared/string-code-types';
import { recordImport } from '@transform/shared';
import { camelCase } from '@utils/camelCase';
import { randomHash } from '@utils/hash';
import { DirectiveNode, SimpleExpressionNode } from '@vue/compiler-core';
import type { PropsIR } from '../syntax-processor/process/props';
import type { SlotPropsIR } from '../syntax-processor/process/props/resolve-v-slot-prop';
import type { ElementNodeIR } from '../syntax-processor/process/resolve-element-node';
import { resolveSpecialExpressions, resolveStringExpr } from './resolve-string-expression';
import { isSimpleStyle } from './style-utils';
import { BabelExp, PropTypes } from './types';

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
  if (rawName === 'v-for') {
    return name;
  }

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
  if (strCodeTypes.isStringLiteral(value)) {
    return value;
  }

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

export function findSameProp(
  source: Array<PropsIR | SlotPropsIR>,
  target: PropsIR,
): PropsIR | undefined {
  const found = source.find(
    (prop) =>
      prop.isStatic &&
      target.isStatic &&
      prop.type !== PropTypes.SLOT &&
      target.type !== PropTypes.SLOT &&
      prop.name === target.name,
  );

  return found as PropsIR | undefined;
}

export function wrapSingleQuotes(content: string, condition?: boolean) {
  return condition || strCodeTypes.isStringLiteral(content) ? `'${content}'` : content;
}

export function checkPropIsDynamicKey(ctx: ICompilationContext, node: DirectiveNode) {
  const isKeyStatic = (node.arg as SimpleExpressionNode)?.isStatic;
  const { source, filename } = ctx;

  if (node.rawName === 'v-bind' && !node.name) {
    logger.warn('Keyless v-bind will overwrite all previously declared props at runtime.', {
      source,
      loc: node.arg?.loc,
      file: filename,
    });
    return;
  }

  if (isKeyStatic === false) {
    logger.warn('Avoid using dynamic slot names, as they generate complex JSX prop expressions.', {
      source,
      loc: node.arg?.loc,
      file: filename,
    });
  }
}

export function addKeyToNodeIR(node: ElementNodeIR, _ir: unknown, ctx: ICompilationContext) {
  const keyProp = createPropsIR('key', 'key', randomHash());
  keyProp.value.isStringLiteral = true;

  resolvePropAsBabelExp(keyProp, ctx);
  node.props.push(keyProp);
}

export function resolvePropAsBabelExp(ir: PropsIR, ctx: ICompilationContext) {
  const name = ir.name;
  const nameExp = ir.babelExp;
  const value = ir.value;
  const valueContent = value.content;
  const mergedItems = value.merge;

  const setNameIdentifier = (target: typeof nameExp, valueName: string) => {
    target.content = valueName;
    target.ast = t.jsxIdentifier(valueName);
  };

  const setValueExpression = (
    target: typeof value.babelExp,
    content: string,
    isStringLiteral?: boolean,
  ) => {
    target.content = content;
    target.ast = resolveStringExpr(content, ctx, isStringLiteral);
  };

  const createRuntimeCall = (fnName: string, args: Array<string | undefined | null>) => {
    const fnArgs = args.filter(Boolean).join(',');
    return `${fnName}(${fnArgs})`;
  };

  const applyRuntimeExpression = (
    expression: string,
    setName = false,
    nameIdentifier?: string,
    isStringLiteral?: boolean,
  ) => {
    if (setName && nameIdentifier) {
      setNameIdentifier(nameExp, nameIdentifier);
    }

    setValueExpression(value.babelExp, expression, isStringLiteral);
    recordImport(ctx, PACKAGE_NAME.runtime, ADAPTER_UTILS_MAP.dir);
  };

  if (ir.isKeyLessVBind) {
    const expression = createRuntimeCall(ADAPTER_UTILS_MAP.dirKeyless, [valueContent]);
    applyRuntimeExpression(expression, false);
    return;
  }

  if (isClassAttr(name) && !value.isStringLiteral && !valueContent.startsWith(STYLE_MODULE_NAME)) {
    const arg = mergedItems?.join(',') || wrapSingleQuotes(valueContent);
    const expression = createRuntimeCall(ADAPTER_UTILS_MAP.dirCls, [arg]);

    applyRuntimeExpression(expression, true, name);
    return;
  }

  if (
    isStyleAttr(name) &&
    (!isSimpleStyle(valueContent) || mergedItems?.some((item) => !isSimpleStyle(item)))
  ) {
    const arg = mergedItems?.join(',') || valueContent;
    const expression = createRuntimeCall(ADAPTER_UTILS_MAP.dirStyle, [arg]);

    applyRuntimeExpression(expression, true, name);
    return;
  }

  if (ir.type === PropTypes.EVENT && ir.modifiers?.length) {
    const eventName = wrapSingleQuotes((ir as any).__vOnEvName || name, ir.isStatic);
    const expression = createRuntimeCall(ADAPTER_UTILS_MAP.dirOn, [eventName, valueContent]);

    applyRuntimeExpression(expression, true, name);
    return;
  }

  if (!ir.isStatic) {
    const tpl = `{[${name}]:${valueContent}}`;
    nameExp.content = tpl;
    nameExp.ast = resolveStringExpr(tpl, ctx);
    return;
  }

  setNameIdentifier(nameExp, name);

  const normalizedValue = resolveSpecialExpressions(valueContent, ctx);
  setValueExpression(value.babelExp, normalizedValue, value.isStringLiteral);
}
