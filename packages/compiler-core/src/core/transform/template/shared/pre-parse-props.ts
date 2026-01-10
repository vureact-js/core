import * as t from '@babel/types';
import { ICompilationContext } from '@compiler/context/types';
import {
  clsRuntime,
  styleRuntime,
  vBindRuntime,
  vOnRuntime,
} from '@src/core/transform/shared/setup-runtime-utils';
import { PropsIR, PropTypes } from '../props';
import { isClassAttr, isStyleAttr } from '../props/utils';
import { isSimpleStyle } from './parse-style-string';
import { resolveTemplateExp } from './resolve-str-exp';
import { wrapSingleQuotes } from './utils';

export function preParseProp(ctx: ICompilationContext, propsIR: PropsIR) {
  const runtimeExp = getNeedRuntimeHelper(ctx, propsIR);
  if (runtimeExp) {
    updatePropsIR(ctx, propsIR, runtimeExp, true);
  } else {
    updatePropsIR(ctx, propsIR);
  }
}

function getNeedRuntimeHelper(ctx: ICompilationContext, propsIR: PropsIR): string | null {
  const {
    type,
    name,
    modifiers,
    isKeyLessVBind,
    value: { content, merge, isStringLiteral },
  } = propsIR;

  if (isKeyLessVBind) {
    return handleKeylessBind(ctx, propsIR);
  }

  if (isClassAttr(name) && !isStringLiteral) {
    return handleClass(ctx, propsIR);
  }

  if (isStyleAttr(name)) {
    if (!isSimpleStyle(content) || merge?.some((m) => !isSimpleStyle(m))) {
      return handleStyle(ctx, propsIR);
    }
  }

  if (type === PropTypes.EVENT && modifiers?.length) {
    return handleEvent(ctx, propsIR);
  }

  return null;
}

function updatePropsIR(
  ctx: ICompilationContext,
  propsIR: PropsIR,
  babelExp?: string,
  clearContent?: boolean,
) {
  // 不包含模板 slot 的解析，需要在生成阶段处理

  const propValue = babelExp || propsIR.value.content;

  const handleName = () => {
    const { name, isStatic } = propsIR;
    const exp: PropsIR['babelExp'] = {
      content: name,
      ast: t.jsxIdentifier(name),
    };

    if (!isStatic) {
      const spread = `{[${name}]: ${propValue}}`;

      exp.content = spread;
      exp.ast = resolveTemplateExp(ctx, spread);
    }

    propsIR.babelExp = exp;
  };

  const handleValue = () => {
    if (!propsIR.isStatic) return;

    const { babelExp, isStringLiteral } = propsIR.value;

    babelExp.content = propValue;
    babelExp.ast = resolveTemplateExp(ctx, propValue, isStringLiteral);

    if (clearContent) propsIR.value.content = '';
  };

  handleName();
  handleValue();
}

function handleClass(ctx: ICompilationContext, propsIR: PropsIR): string {
  const {
    value: { content, merge },
  } = propsIR;
  const arg = wrapSingleQuotes(content);
  const mergeArgs = merge?.join(',');
  return clsRuntime(ctx, mergeArgs ?? arg);
}

function handleStyle(ctx: ICompilationContext, propsIR: PropsIR): string {
  const {
    value: { content, merge },
  } = propsIR;
  const mergeArgs = merge?.join(',');
  return styleRuntime(ctx, mergeArgs ?? content);
}

function handleEvent(ctx: ICompilationContext, propsIR: PropsIR): string {
  const {
    name,
    isStatic,
    value: { content },
  } = propsIR;
  const evName = (propsIR as any).__vOnEvName || name;
  return vOnRuntime(ctx, wrapSingleQuotes(evName, isStatic), content);
}

function handleKeylessBind(ctx: ICompilationContext, propsIR: PropsIR): string {
  const {
    value: { content },
  } = propsIR;
  return vBindRuntime(ctx, content);
}
