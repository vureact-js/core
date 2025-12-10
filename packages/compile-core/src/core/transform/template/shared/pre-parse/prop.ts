import { parseFragmentExp } from '@shared/babel-utils';
import { clsRuntime, styleRuntime, vBindRuntime, vOnRuntime } from '@shared/runtime-utils';
import { PropsIR, PropTypes } from '../../props';
import { isSimpleStyle } from '../../props/style';
import { isClassAttr, isStyleAttr } from '../../props/utils';
import { wrapSingleQuotes } from '../wrap-single-quotes';

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
  const {
    value: { content, isStringLiteral },
  } = propsIR;

  const previewCode = babelCode || content;

  if (clearContent) propsIR.value.content = '';
  propsIR.value.babelExp.content = previewCode;
  propsIR.value.babelExp.ast = parseFragmentExp(previewCode, isStringLiteral);
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
  const evName = wrapSingleQuotes(name, isStatic);
  return vOnRuntime(evName, content);
}

function handleKeylessBind(propsIR: PropsIR): string {
  const {
    value: { content },
  } = propsIR;
  return vBindRuntime(content);
}
