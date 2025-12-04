import { RuntimeHelper } from '@core/transform/types';
import { isSimpleExpression } from '@shared/getStrCodeBabelType';
import { vueAttrToReactProp } from '@utils/vueAttrToReactProp';
import { enablePropsRuntimeAssistance } from '../../shared';
import { BaseBlock, BlockTypes, PropsIR } from './index';
import { parseStyleString } from './style';

export type AttributeBlock = BaseBlock &
  RuntimeHelper & {
    rawName: string;
    name: string;
    value: {
      content: string;
      toBeMerged?: string | [string, string];
    };
    /*
      非静态键需生成 jsx 对象展开运算符： {...{[name]: value}}
    */
    isStatic: boolean;
  };

type HandleAttributeBlockOptions = Omit<CreateAttrOptions, 'rawName'> & { propsIR: PropsIR };

const attrsToBeMerged = ['class', 'style'];

export function handleAttributeBlock(opts: HandleAttributeBlockOptions) {
  const { name, value, propsIR, isStaticKey, isStaticValue } = opts;

  let isExisted = false;

  propsIR.attributes.some((attr) => {
    if (name === attr.rawName) {
      const newValue: AttributeBlock['value'] = {
        content: normalizeValue(value, isStaticValue),
      };

      updateValue(attr, newValue);

      isExisted = true;
      return true;
    }
  });

  if (!isExisted) {
    const attr = createAttributeBlock({ name, value, isStaticKey, isStaticValue });
    enablePropsRuntimeAssistance(attr);
    propsIR.attributes.push(attr);
  }
}

function updateValue(attr: AttributeBlock, newValue: AttributeBlock['value']) {
  const { rawName } = attr;
  const newContent = newValue.content;

  // Vue 只有 class 和 style 支持合并
  if (attrsToBeMerged.includes(rawName)) {
    if (rawName === 'class') {
      attr.value.toBeMerged = newContent;
      return;
    }

    if (rawName === 'style') {
      const oldMergeItem = attr.value.toBeMerged;
      if (oldMergeItem && typeof oldMergeItem === 'string') {
        attr.value.toBeMerged = [oldMergeItem, newContent];
        return;
      }
      attr.value.toBeMerged = isSimpleExpression(newContent)
        ? parseStyleString(newContent)
        : newContent;
    }
  } else {
    // 不支持合并的属性直接覆盖
    attr.value = newValue;
  }

  enablePropsRuntimeAssistance(attr);
}

export type CreateAttrOptions = {
  name: string;
  value: string;
  rawName?: string;
  isStaticKey: boolean;
  isStaticValue: boolean;
};

export function createAttributeBlock(opts: CreateAttrOptions): AttributeBlock {
  const { name: key, value, rawName = key, isStaticKey, isStaticValue } = opts;

  const name = vueAttrToReactProp(key);

  const content = normalizeValue(value, isStaticValue);

  const attrValue: AttributeBlock['value'] = {
    content,
  };

  return {
    type: BlockTypes.ATTRIBUTE,
    rawName,
    name,
    value: attrValue,
    isStatic: isStaticKey,
    runtimeHelper: {} as RuntimeHelper['runtimeHelper'],
  };
}

function normalizeValue(value: string, isStatic: boolean): string {
  return isStatic && value !== 'true' && value !== 'false' ? `'${value}'` : value;
}
