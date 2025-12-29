import { parseTemplateExp } from '@shared/babel-utils';
import { PropsIR, PropTypes } from '../props';
import { isClassAttr, isStyleAttr } from '../props/utils';
import { isSimpleStyle, parseStyleString } from './parse-style-string';
import { wrapSingleQuotes } from './utils';

export function mergePropsIR(oldAttr: PropsIR, newAttr: PropsIR) {
  // 只有 class 和 style 需要合并
  if (isClassAttr(newAttr.rawName)) {
    mergeClass(oldAttr, newAttr);
  } else if (isStyleAttr(newAttr.rawName)) {
    mergeStyles(oldAttr, newAttr);
  } else {
    // 非 class 和 style 直接覆盖最新值
    for (const key in newAttr) {
      // @ts-ignore
      oldAttr[key] = newAttr[key];
    }
  }
}

function mergeClass(oldAttr: PropsIR, newAttr: PropsIR) {
  const oldContent = oldAttr.value.content;
  const newContent = newAttr.value.content;

  const oldIsAttr = oldAttr.type === PropTypes.ATTRIBUTE;
  const newIsAttr = newAttr.type === PropTypes.ATTRIBUTE;

  const oldIsStr = oldAttr.value.isStringLiteral;
  const newIsStr = newAttr.value.isStringLiteral;

  const stripSingleQuotes = (s: string) => s.replace(/^'|'$/g, '');

  // class="a" & :class="'b'"  或  :class="'a'" & class="b"
  if (newIsStr && oldIsStr) {
    const left = !oldIsAttr ? stripSingleQuotes(oldContent) : oldContent;
    const right = !newIsAttr ? stripSingleQuotes(newContent) : newContent;
    const merged = `${left} ${right}`.trim();

    oldAttr.value.content = merged;
    oldAttr.value.babelExp.ast = parseTemplateExp(merged);

    return;
  }

  // 运行时工具处理（默认情况）

  // 需对静态属性值手动包裹括号
  const oldCls = wrapSingleQuotes(oldContent, oldIsAttr);
  const newCls = wrapSingleQuotes(newContent, newIsAttr);

  oldAttr.value.isStringLiteral = false;
  oldAttr.value.merge = [oldCls, newCls];
}

function mergeStyles(oldAttr: PropsIR, newAttr: PropsIR) {
  const oldStyle = oldAttr.value.content;
  const newStyle = parseStyleString(newAttr.value.content);

  let merged = oldAttr.value.merge;

  if (!merged?.length) {
    merged = oldAttr.value.merge = [oldStyle, newStyle];
  } else {
    merged.push(newStyle);
  }

  // 合并新旧 style 都是解析过的 style object
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

  // 其他情况由运行时工具处理
}
