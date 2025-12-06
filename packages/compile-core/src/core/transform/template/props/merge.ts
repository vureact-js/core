import { enablePropsRuntimeAssistance } from '@core/transform/shared';
import { strCodeTypes } from '@shared/getStrCodeBabelType';
import { PropsIR } from '.';
import { isClassAttr, isStyleAttr } from './utils';

export function mergeAttributeIR(target: PropsIR, source: PropsIR) {
  const sourceContent = source.value.content;

  // 只有 class 和 style 需要合并
  if (isClassAttr(source.name)) {
    mergeClassAttribute(target, sourceContent);
    return;
  }

  if (isStyleAttr(source.name)) {
    mergeStyleAttribute(target, sourceContent);
    return;
  }

  // 非 class 和 style 直接覆盖最新值
  for (const key in source) {
    // @ts-ignore
    target[key] = source[key];
  }
}

function mergeClassAttribute(target: PropsIR, sourceContent: string) {
  // 简单值直接拼接合并
  if (strCodeTypes.isStringLiteral(sourceContent)) {
    target.value.content += ` + ${sourceContent}`;
    return;
  }

  // 复杂表达式需运行时 vBindCls 处理
  target.value.isBabelParseExp = false;
  target.value.combines = sourceContent;

  enablePropsRuntimeAssistance(target);
}

function mergeStyleAttribute(target: PropsIR, sourceContent: string) {
  if (sourceContent === '{}') return;

  const targetStyle = target.value.content;

  if (!target.value.combines) {
    // style combines 没有内容则说明总共只有2项需要合并
    target.value.combines = [targetStyle, sourceContent];
    // 使用 Object.assign
    target.value.content = `Object.assign(${targetStyle}, ${sourceContent})`;
    return;
  }

  const targetCombines = target.value.combines;

  // style combines 已有内容且使用数组保存，则总共3项需要合并
  if (Array.isArray(targetCombines)) {
    targetCombines.push(sourceContent);
    target.value.content = `Object.assign({}, ${targetCombines.map((s) => `${s}`).join(',')})`;
  }
}
