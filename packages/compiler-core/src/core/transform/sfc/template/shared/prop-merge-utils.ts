import { ICompilationContext } from '@compiler/context/types';
import type { PropsIR } from '../syntax-processor/process/props';
import { isClassAttr, isStyleAttr, wrapSingleQuotes } from './prop-ir-utils';
import { resolveStringExpr } from './resolve-string-expression';
import { isSimpleStyle, parseStyleString } from './style-utils';
import { PropTypes } from './types';

export function mergePropsIR(ctx: ICompilationContext, oldAttr: PropsIR, newAttr: PropsIR) {
  if (isClassAttr(newAttr.rawName)) {
    mergeClassProps(ctx, oldAttr, newAttr);
    return;
  }

  if (isStyleAttr(newAttr.rawName)) {
    mergeStyleProps(oldAttr, newAttr);
    return;
  }

  for (const key in newAttr) {
    // @ts-ignore
    oldAttr[key] = newAttr[key];
  }
}

function mergeClassProps(ctx: ICompilationContext, oldAttr: PropsIR, newAttr: PropsIR) {
  const oldContent = oldAttr.value.content;
  const newContent = newAttr.value.content;

  const oldIsAttr = oldAttr.type === PropTypes.ATTRIBUTE;
  const newIsAttr = newAttr.type === PropTypes.ATTRIBUTE;

  const oldIsString = oldAttr.value.isStringLiteral;
  const newIsString = newAttr.value.isStringLiteral;

  const stripSingleQuotes = (value: string) => value.replace(/^'|'$/g, '');

  if (newIsString && oldIsString) {
    const left = !oldIsAttr ? stripSingleQuotes(oldContent) : oldContent;
    const right = !newIsAttr ? stripSingleQuotes(newContent) : newContent;
    const merged = `${left} ${right}`.trim();

    oldAttr.value.content = merged;
    oldAttr.value.babelExp.ast = resolveStringExpr(merged, ctx);
    return;
  }

  const oldClass = wrapSingleQuotes(oldContent, oldIsAttr);
  const newClass = wrapSingleQuotes(newContent, newIsAttr);

  oldAttr.value.isStringLiteral = false;
  oldAttr.value.merge = [oldClass, newClass];
}

function mergeStyleProps(oldAttr: PropsIR, newAttr: PropsIR) {
  const oldStyle = oldAttr.value.content;
  const newStyle = parseStyleString(newAttr.value.content);

  let merged = oldAttr.value.merge;

  if (!merged?.length) {
    merged = oldAttr.value.merge = [oldStyle, newStyle];
  } else {
    merged.push(newStyle);
  }

  if (isSimpleStyle(oldStyle) && isSimpleStyle(newStyle)) {
    if (merged.length === 1) {
      oldAttr.value.content = `Object.assign(${oldStyle}, ${newStyle})`;
      return;
    }

    if (merged.length > 1) {
      oldAttr.value.content = `Object.assign({}, ${merged.map((value) => `${value}`).join(',')})`;
    }
  }
}
