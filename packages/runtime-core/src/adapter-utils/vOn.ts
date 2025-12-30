import { camelCase, capitalize } from './shared';

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

type VOnReturnType<E> = EventObject<E> | EventCallback<E>;

type EventObject<E> = Record<string, EventCallback<E>>;

type EventCallback<E> = (...args: any[]) => E;

/**
 * vOn - Runtime helper for Vue v-on directive in React JSX
 *
 * @param event event name, allowing chaining with modifiers.
 * @param handler event handler.
 * @param fullEventObj return event name with handler.
 *
 * @returns standardized JSX event prop object
 *
 * @example
 *
 * <div onClick={vOn('click.once', count++)} />
 * <div onMouseDown={vOn('mousedown.right', e => {})} />
 * <div onKeyDown={vOn('keydown.enter', e => {})} />
 */
export function vOn<E = any>(
  event: string,
  handler: any | EventCallback<E>,
  fullEventObj = false,
): VOnReturnType<E> {
  const result: EventObject<E> = {};
  const evName = normalizeEventKey(event);
  const evMods = normalizeModifiers(event);
  const evHandler = (typeof handler !== 'function' ? () => handler : handler) as EventCallback<E>;

  let once = false;

  const callWithModifiers = (...args: any[]): E => {
    const returnVoid = undefined as E;

    if (once) return returnVoid;

    const [e] = args;

    // 先验证所有条件修饰符（若失败则提前 return）
    for (const modifier of evMods) {
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
    for (const modifier of evMods) {
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

    return evHandler(...args);
  };

  if (!evMods.length) {
    const fn = (...args: any[]) => evHandler(...args);
    result[evName] = fn;
  } else {
    result[evName] = callWithModifiers;
  }

  return fullEventObj ? result : result[evName];
}

function normalizeEventKey(event: string): string {
  const [rawName, ...modifiers] = event.split('.');
  const hasCapture = modifiers.findIndex((mod) => mod === 'capture');

  let eventName = `on${camelCase(capitalize(rawName!))}`;

  if (hasCapture > -1) {
    eventName = modifiers[hasCapture] ? `${eventName}Capture` : eventName;
  }

  return eventName;
}

function normalizeModifiers(event: string): string[] {
  const [_, ...modifiers] = event.split('.');
  return modifiers.filter((m) => RUNTIME_MODIFIERS.includes(m) || m in KEY_MAP);
}
