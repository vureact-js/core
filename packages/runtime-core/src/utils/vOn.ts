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

type EventCallback<T> = (...args: any[]) => T;

/**
 * vOn - Runtime helper for Vue v-on directive in React JSX
 *
 * @param event event name, allowing chaining with modifiers.
 * @param handler event handler.
 * @returns standardized JSX event prop object
 *
 * @example
 *
 * <div onClick={vOn('click.once', count++)} />
 * <div onMouseDown={vOn('mousedown.right', e => {})} />
 * <div onKeyDown={vOn('keydown.enter', e => {})} />
 */
export function vOn<T>(event: string, handler: T): EventCallback<T>;
export function vOn<T>(event: string, handler: EventCallback<T>): EventCallback<T> {
  const [_, ...modifiers] = event.split('.');
  const callback = typeof handler !== 'function' ? () => handler : handler;

  const evModifiers = modifiers.filter((m) => RUNTIME_MODIFIERS.includes(m) || m in KEY_MAP);

  if (!evModifiers.length) {
    return (...args) => callback(...args);
  }

  let once = false;

  return (...args: any[]): T => {
    const returnVoid = undefined as T;

    if (once) return returnVoid;

    const [e] = args;

    // 先验证所有条件修饰符（若失败则提前 return）
    for (const modifier of evModifiers) {
      switch (modifier) {
        case 'self':
          if (e?.target !== e?.currentTarget) {
            return returnVoid;
          }
          break;
        case 'left':
        case 'middle':
        case 'right':
          if (e?.button !== MOUSE_BUTTONS[modifier]) {
            return returnVoid;
          }
          break;
        default:
          // 键盘按键验证
          const expectedKey = KEY_MAP[modifier as keyof typeof KEY_MAP];
          if (expectedKey && e?.key !== expectedKey) {
            return returnVoid;
          }
      }
    }

    // 验证通过，应用所有动作修饰符
    for (const modifier of evModifiers) {
      switch (modifier) {
        case 'once':
          once = true;
          break;
        case 'stop':
          e?.stopPropagation?.();
          break;
        case 'prevent':
          e?.preventDefault?.();
          break;
      }
    }

    return callback(...args);
  };
}
