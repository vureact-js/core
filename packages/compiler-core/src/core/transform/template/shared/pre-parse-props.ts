import * as t from '@babel/types';
import { clsRuntime, styleRuntime, vBindRuntime, vOnRuntime } from '@shared/runtime-utils';
import { PropsIR, PropTypes } from '../props';
import { isClassAttr, isStyleAttr } from '../props/utils';
import { isSimpleStyle } from './parse-style-string';
import { resolveTemplateExp } from './resolve-str-exp';
import { wrapSingleQuotes } from './utils';

export function preParseProp(propsIR: PropsIR) {
  const handler = getNeedRuntimeHandler(propsIR);
  if (handler) {
    const babelCode = handler(propsIR);
    updatePropsIR(propsIR, babelCode, true);
  } else {
    updatePropsIR(propsIR);
  }
}

function getNeedRuntimeHandler(propsIR: PropsIR): ((propsIR: PropsIR) => string) | null {
  const {
    type,
    name,
    modifiers,
    isKeyLessVBind,
    value: { content, merge, isStringLiteral },
  } = propsIR;

  if (isKeyLessVBind) return handleKeylessBind;

  if (isClassAttr(name) && !isStringLiteral) return handleClass;

  if (isStyleAttr(name)) {
    if (!isSimpleStyle(content) || merge?.some((m) => !isSimpleStyle(m))) {
      return handleStyle;
    }
  }

  if (type === PropTypes.EVENT && modifiers?.length) return handleEvent;

  return null;
}

function updatePropsIR(propsIR: PropsIR, babelCode?: string, clearContent?: boolean) {
  // 不包含模板 slot 的解析，需要在生成阶段处理

  const propValue = babelCode || propsIR.value.content;

  const handleName = () => {
    const { name, isStatic } = propsIR;
    const exp: PropsIR['babelExp'] = {
      content: name,
      ast: t.jsxIdentifier(name),
    };

    if (!isStatic) {
      const spread = `{[${name}]: ${propValue}}`;

      exp.content = spread;
      exp.ast = resolveTemplateExp(spread);
    }

    propsIR.babelExp = exp;
  };

  const handleValue = () => {
    if (!propsIR.isStatic) return;

    const { babelExp, isStringLiteral } = propsIR.value;

    babelExp.content = propValue;
    babelExp.ast = resolveTemplateExp(propValue, isStringLiteral);

    if (clearContent) propsIR.value.content = '';
  };

  handleName();
  handleValue();
}

function handleClass(propsIR: PropsIR): string {
  const {
    value: { content, merge },
  } = propsIR;
  const arg = wrapSingleQuotes(content);
  const mergeArgs = merge?.join(',');
  return clsRuntime(mergeArgs ?? arg);
}

function handleStyle(propsIR: PropsIR): string {
  const {
    value: { content, merge },
  } = propsIR;
  const mergeArgs = merge?.join(',');
  return styleRuntime(mergeArgs ?? content);
}

function handleEvent(propsIR: PropsIR): string {
  const {
    name,
    isStatic,
    value: { content },
  } = propsIR;
  const evName = (propsIR as any).__vOnEvName || name;
  return vOnRuntime(wrapSingleQuotes(evName, isStatic), content);
}

function handleKeylessBind(propsIR: PropsIR): string {
  const {
    value: { content },
  } = propsIR;
  return vBindRuntime(content);
}
