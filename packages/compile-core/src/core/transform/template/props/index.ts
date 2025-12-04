import { getContext } from '@core/transform/context';
import { RuntimeHelper } from '@core/transform/types';
import { NodeTypes, ElementNode as VueElementNode } from '@vue/compiler-core';
import { AttributeBlock, handleAttributeBlock } from './attributes';
import { DirectiveBlock, handleOrdinaryDirective, handleSpecialDirective } from './directives';
import { EventBindinBlock } from './eventBindings';
import { SlotBlock } from './slots';
import { createPropsIR } from './utils';

export interface PropsIR {
  // 所有静态属性和 v-bind 属性
  attributes: AttributeBlock[];
  // 特殊 v-* 指令类 （v-for v-if 等）
  directives: DirectiveBlock[];
  // 事件绑定
  eventBindings: EventBindinBlock[];
  // v-slot
  slots: SlotBlock[];
}

export type PropBlock = AttributeBlock | ExpressionBlock;

export type ExpressionBlock = BaseBlock &
  RuntimeHelper & {
    rawName?: string;
    name: string;
    exp: {
      content: string;
      /* 完整可用的小段代码，可通过 parseExpression 直接生成 */
      complete: boolean;
    };
    modifiers?: string[];
    isStatic?: boolean;
  };

export interface BaseBlock {
  type: BlockTypes;
}

export enum BlockTypes {
  ATTRIBUTE = 1,
  DIRECTIVE = 2,
  SLOT = 3,
  EVENT = 4,
}

export const specialDirectivePattern = /^v-(if|else|else-if|once|memo|for)$/;

export function transformProps(node: VueElementNode): PropsIR {
  const propsIR = createPropsIR();

  for (const prop of node.props) {
    const name = prop.name;

    if (prop.type === NodeTypes.ATTRIBUTE) {
      const value = prop.value?.content || '';

      // 保存 DOM ref
      if (name === 'ref') {
        const { nodeRefs } = getContext();
        nodeRefs.add(value);
      }

      handleAttributeBlock({
        name,
        value,
        propsIR,
        isStaticKey: true,
        isStaticValue: true,
      });

      continue;
    }

    if (prop.type === NodeTypes.DIRECTIVE) {
      if (specialDirectivePattern.test(prop.rawName ?? name)) {
        handleSpecialDirective(prop, propsIR);
        continue;
      }

      handleOrdinaryDirective(node, prop, propsIR);
    }
  }

  return propsIR;
}
