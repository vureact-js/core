import { strCodeTypes } from '@shared/getStrCodeBabelType';
import { PropsIR } from '.';
import { isSimpleStyle, parseStyleString } from './style';
import { isClassAttr, isStyleAttr } from './utils';

export function mergePropsIR(oldAttr: PropsIR, newAttr: PropsIR) {
  const newContent = newAttr.value.content;

  // 只有 class 和 style 需要合并
  if (isClassAttr(newAttr.rawName)) {
    mergeClass(oldAttr, newContent);
    return;
  }

  if (isStyleAttr(newAttr.rawName)) {
    mergeStyles(oldAttr, newContent);
    return;
  }

  // 非 class 和 style 直接覆盖最新值
  for (const key in newAttr) {
    // @ts-ignore
    oldAttr[key] = newAttr[key];
  }
}

function mergeClass(oldAttr: PropsIR, newContent: string) {
  const oldContent = oldAttr.value.content;

  oldAttr.value.merge = [oldContent, newContent];

  if (strCodeTypes.isStringLiteral(newContent)) {
    // 简单值直接拼接合并
    const cur = oldContent.replace(/'/g, '');
    const last = newContent.replace(/'/g, '');

    oldAttr.value.content = `${cur} ${last}`;
  }
}

function mergeStyles(oldAttr: PropsIR, newContent: string) {
  const oldStyle = oldAttr.value.content;
  const newStyle = parseStyleString(newContent);

  let merged = oldAttr.value.merge;

  if (!merged?.length) {
    merged = oldAttr.value.merge = [oldStyle, newStyle];
  } else {
    merged.push(newStyle);
  }

  if (isSimpleStyle(oldStyle) && isSimpleStyle(newStyle)) {
    // 合并新旧 style 2项
    if (merged.length === 1) {
      oldAttr.value.content = `Object.assign(${oldStyle}, ${newStyle})`;
      return;
    }

    // 合并项已有内容，则总共3项需要合并
    // 为什么会有3项，因为 v-show 单独占了 style.display 一项
    if (merged.length > 1) {
      oldAttr.value.content = `Object.assign({}, ${merged.map((s) => `${s}`).join(',')})`;
    }
  }
}
