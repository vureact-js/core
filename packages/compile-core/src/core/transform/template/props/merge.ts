import { strCodeTypes } from '@src/shared/string-code-types';
import { PropsIR } from '.';
import { isSimpleStyle, parseStyleString } from './style';
import { isClassAttr, isStyleAttr } from './utils';

export function mergePropsIR(oldAttr: PropsIR, newAttr: PropsIR) {
  // 只有 class 和 style 需要合并
  if (isClassAttr(newAttr.rawName)) {
    mergeClass(oldAttr, newAttr);
    return;
  }

  if (isStyleAttr(newAttr.rawName)) {
    mergeStyles(oldAttr, newAttr);
    return;
  }

  // 非 class 和 style 直接覆盖最新值
  for (const key in newAttr) {
    // @ts-ignore
    oldAttr[key] = newAttr[key];
  }
}

function mergeClass(oldAttr: PropsIR, newAttr: PropsIR) {
  const oldContent = oldAttr.value.content;
  const newContent = newAttr.value.content;

  // 通过 isIdentifier 判断属性是否是 class="" 还是 v-bind:class="''"
  // 要么class前者是静态属性，后者是动态，要么相反

  // 简单值直接拼接合并
  if (
    (!oldAttr.value.isIdentifier && strCodeTypes.isStringLiteral(newContent)) ||
    (!newAttr.value.isIdentifier && strCodeTypes.isStringLiteral(oldContent))
  ) {
    const cur = oldContent.replace(/'/g, '');
    const last = newContent.replace(/'/g, '');

    oldAttr.value.content = `${cur} ${last}`;

    return;
  }

  oldAttr.value.isIdentifier = true;
  oldAttr.value.merge = [oldContent, newContent];
}

function mergeStyles(oldAttr: PropsIR, newAttr: PropsIR) {
  const oldStyle = oldAttr.value.content;
  const newStyle = parseStyleString(newAttr.value.content, newAttr.value.isIdentifier);

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

    return;
  }
}
