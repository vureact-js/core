import { capitalize } from './capitalize';

const RUNTIME_MODIFIERS = ['stop', 'prevent', 'self', 'left', 'middle', 'right', 'once'];

const MOUSE_BUTTONS = { left: 0, middle: 1, right: 2 } as const;

const KEY_MAP = {
  enter: 'Enter',
  esc: 'Escape',
  space: ' ',
  tab: 'Tab',
  delete: 'Delete',
  up: 'ArrowUp',
  down: 'ArrowDown',
  left: 'ArrowLeft',
  right: 'ArrowRight',
} as const;

type VOnEvent<T> = {
  [x: string]: (...args: T[]) => void;
};

/**
 * vOn - Runtime helper for Vue v-on directive in React JSX
 *
 * @param event event name, allowing chaining with modifiers.
 * @param handler event handler.
 * @returns standardized JSX event prop object
 *
 * @example
 *
 * //@click.stop.self="handler" -> vOn('click.stop.self', handler);
 */
export function vOn<T>(event: string, handler: (...args: T[]) => void): VOnEvent<T> {
  const [name, ...modifiers] = event.split('.');
  const eventName = `on${capitalize(name!)}`;

  const runtimeModifiers = modifiers.filter((m) => RUNTIME_MODIFIERS.includes(m) || m in KEY_MAP);

  if (!runtimeModifiers.length) {
    return { [eventName]: handler };
  }

  let once = false;

  return {
    [eventName]: (...args: any[]) => {
      if (once) return;

      const [event, ..._] = args;

      // 先验证所有条件修饰符（若失败则提前 return）
      for (const modifier of runtimeModifiers) {
        switch (modifier) {
          case 'self':
            if (event?.target !== event?.currentTarget) return;
            break;
          case 'left':
          case 'middle':
          case 'right':
            if (event?.button !== MOUSE_BUTTONS[modifier]) return;
            break;
          default:
            // 键盘按键验证
            const expectedKey = KEY_MAP[modifier as keyof typeof KEY_MAP];
            if (expectedKey && event?.key !== expectedKey) return;
        }
      }

      // 验证通过，应用所有动作修饰符
      for (const modifier of runtimeModifiers) {
        switch (modifier) {
          case 'once':
            once = true;
            break;
          case 'stop':
            event?.stopPropagation?.();
            break;
          case 'prevent':
            event?.preventDefault?.();
            break;
        }
      }

      handler(...args);
    },
  };
}
