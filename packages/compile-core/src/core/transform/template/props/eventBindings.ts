import { RuntimeHelper } from '@core/transform/types';
import { strCodeTypes } from '@shared/getStrCodeBabelType';
import { camelCase } from '@utils/camelCase';
import { capitalize } from '@utils/capitalize';
import { DirectiveNode, SimpleExpressionNode } from '@vue/compiler-core';
import { enablePropsRuntimeAssistance } from '../../shared';
import { BlockTypes, ExpressionBlock, PropsIR } from './index';

export type EventBindinBlock = ExpressionBlock;

export function handleEventBlock(prop: DirectiveNode, propsIR: PropsIR) {
  const arg = prop.arg as SimpleExpressionNode;
  const name = `on${capitalize(camelCase(arg?.content || ''))}`;

  const block = createEventBlock({
    name,
    exp: {
      complete: false,
      content: (prop.exp as SimpleExpressionNode).content,
    },
    modifiers: prop.modifiers.map((m) => m.content),
    isManual: false,
  });

  propsIR.eventBindings.push(block);
}

export type CreateEventOptions = Omit<EventBindinBlock, 'runtime'> & {
  isManual?: boolean; // 是否手动创建（非v-on节点）
};

export function createEventBlock(opts: Partial<CreateEventOptions>): EventBindinBlock {
  const {
    type = BlockTypes.EVENT,
    name,
    exp,
    modifiers = [],
    isStatic = true,
    isManual = false,
  } = opts;

  const eventBlock: EventBindinBlock = {
    type,
    name: name!,
    exp: exp!,
    modifiers,
    isStatic,
    runtimeHelper: {} as RuntimeHelper['runtimeHelper'],
  };

  // 非手动创建（即来自 v-on）需进行表达式包装
  if (!isManual) {
    const trimmed = exp!.content.trim();
    if (strCodeTypes.isCallExpression(trimmed) || !strCodeTypes.isSimpleExpression(trimmed)) {
      eventBlock.exp.content = `() => ${trimmed}`;
      eventBlock.exp.complete = true;
    }
  }

  // 修饰符交给 vOn 运行时
  if (modifiers.length) {
    eventBlock.name = `${name}.${modifiers.join('.')}`;
  }

  enablePropsRuntimeAssistance(eventBlock);

  return eventBlock;
}
