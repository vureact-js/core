import { ClsInputValue, vCls } from './vCls';
import { vKeyless } from './vKeyless';
import { vOn } from './vOn';
import { VStyleItem, vStyle } from './vStyle';

export * from './nextTick';
export * from './vCls';
export * from './vKeyless';
export * from './vOn';
export * from './vStyle';

class AdapterUtil {
  cls(value: ClsInputValue, mergeItem?: ClsInputValue) {
    return vCls(value, mergeItem);
  }

  keyless(obj: Record<string, any>) {
    return vKeyless(obj);
  }

  on(event: string, handler: any, fullEventObj?: boolean) {
    return vOn(event, handler, fullEventObj);
  }

  style(target: VStyleItem, ...mergeItems: VStyleItem[]) {
    return vStyle(target, mergeItems);
  }
}

/**
 * @see https://runtime.vureact.top/guide/utils/adapter-utils.html
 */
export const adapterUtils = new AdapterUtil();

/**
 * @see https://runtime.vureact.top/guide/utils/adapter-utils.html
 */
export const dir = adapterUtils;
