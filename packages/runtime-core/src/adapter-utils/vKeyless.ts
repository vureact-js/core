import { camelCase } from './shared';
import { vCls } from './vCls';
import { vOn } from './vOn';
import { vStyle } from './vStyle';

type Object = Record<string, any>;

/**
 * vKeyless - Runtime helper for Vue `v-bind={...}` directive in React JSX
 *
 * @see https://runtime.vureact.top/guide/utils/v-keyless.html
 *
 * @param obj - object to bind
 * @returns Object that can be spread as JSX props
 *
 * @example
 * <div {...vKeyless({ id: 'foo', class: { active: true }, onClick: handler })} />
 */
export function vKeyless(obj: Object): Object {
  const props: Object = {};

  for (const key in obj) {
    const value = obj[key];

    // 1. 处理 Class (合并 class 和 className，并转为 string)
    if (key === 'class' || key === 'className') {
      // vCls 的第二个参数 additional 用于合并，这里我们将新值与现有的 props.className 合并
      // 如果 props.className 尚未存在，vBindCls 会正确处理 undefined
      props.className = vCls(props.className, value as any); // 修正类型断言
      continue;
    }

    // 2. 处理事件 (vOn)
    // 匹配规则：以 'on' 开头 (onClick) 或包含修饰符 (click.stop)
    // 增加判断条件，捕获简单事件名（如 'click'），其 value 是一个函数
    const isEventKey = key.startsWith('on');
    const isEventKey2 = isEventKey && key.includes('.');

    const isSimpleVueEvent = typeof value === 'function' && (!isEventKey || isEventKey2); // 如果是函数，且没有 on/., 视为 Vue 事件

    if (isEventKey || isSimpleVueEvent) {
      const eventProps = vOn(key, value, true);
      // vOn 返回的是一个对象 { [eventName]: handler }，需要合并进 props
      Object.assign(props, eventProps);
      continue;
    }

    // 3. 处理 Style (Vue 支持数组语法和 cssText，React 不支持，需转换)
    if (key === 'style') {
      props.style = vStyle(value);
      continue;
    }

    // 4. 默认透传
    props[vueAttrToReactProp(key)] = value;
  }

  return props;
}

function vueAttrToReactProp(name: string): string {
  const whitelist = /^data-|datatype|^aria-/;

  switch (name) {
    case 'v-html':
      return 'dangerouslySetInnerHTML';

    case 'class':
      return 'className';

    case 'for':
      return 'htmlFor';

    default:
      return whitelist.test(name) ? name : camelCase(name);
  }
}
