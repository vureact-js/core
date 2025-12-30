import { enableMapSet } from 'immer';
import { useCallback, useMemo, useState } from 'react';
import { Updater, useImmer } from 'use-immer';
import { isMapSetArray, isObject, isPrimitive, mergeDeep } from '../shared/utils';

export type StateHook<S> = [S, StateUpdater<S>];

export type StateUpdater<S> = (update: NewStateOrUpdateFunction<S>) => void;

export type NewStateOrUpdateFunction<S> = State<S> | UpdateFunction<S>;

export type UpdateFunction<S> = (prev: State<S>) => State<S>;

export type State<S> = Partial<S>;

/**
 * An enhanced useState Hook integrated with Immer's immutable update capability.
 *
 * It automatically selects the underlying implementation based on the type of the initial value:
 * 1. Primitive type or shallow mode enabled -> Uses React's native useState.
 * 2. Complex type (Object/Array/Map/Set) -> Uses useImmer.
 *
 * @param {S | (() => S)} initialValue The initial state or a function that computes the initial state.
 * @param {boolean} [shallow=false] Whether to force the use of shallow updates (native useState). The default value is false, meaning the judgment is made automatically based on the data type.
 * @returns {StateHook<S>} Returns the state value and the update function.
 *
 * @see https://react-vue3-hooks.vercel.app/en/hooks/useState$
 *
 * @example
 * // 1. Primitive type update (behaves like useState)
 * const [count, setCount] = useState$(0);
 * setCount(1);
 *
 * // 2. Complex object update (automatic property merging)
 * const [obj, setObj] = useState$({ key: '', config: { a: 1, b: 2 }});
 * setObj({ key: 'h', config: { a: 99 }});
 * // or uses update callback
 * setObj(prev => {
 *   prev.config.a = 99;
 *   return prev;
 * });
 * // result: { key: 'h' ,config: { a: 99, b: 2 }}
 *
 * // 3. Array update (direct replacement)
 * const [list, setList] = useState$([1, 2]);
 * setList(prev => {
 *   prev.push(3);
 *   return prev;
 * });
 * // result: [1, 2, 3]
 */
export function useState$<S>(initialValue: S | (() => S), shallow: boolean = false): StateHook<S> {
  const value = typeof initialValue === 'function' ? (initialValue as () => S)() : initialValue;

  const isUseStateHook = shallow || isPrimitive(value);
  const hook = useMemo(() => (isUseStateHook ? useState : useImmer), [isUseStateHook]);

  const [getter, setter] = hook(value);

  const state = useMemo(() => getter, [getter]);

  const setState = useCallback(
    (update: NewStateOrUpdateFunction<S>) => {
      if (isUseStateHook) {
        const setStateAction = setter as React.Dispatch<React.SetStateAction<S>>;

        setStateAction((prev: any) => {
          // 处理回调函数或直接值的获取
          const nextValue =
            typeof update === 'function' ? (update as UpdateFunction<S>)(prev) : update;

          // 如果是是对象则进行第一层 merge
          if (isObject(nextValue) && !isMapSetArray(nextValue)) {
            return Object.assign(prev, nextValue);
          }

          // 否则直接替换
          return nextValue;
        });

        return;
      }
      const draftFn = setter as Updater<S>;

      draftFn((draft: any) => {
        // 执行更新逻辑
        const nextValue =
          typeof update === 'function' ? (update as UpdateFunction<S>)(draft) : update;

        // 如果新值是原始类型、数组、Map 或 Set，则视为“全量替换”
        if (isPrimitive(nextValue) || isMapSetArray(nextValue)) {
          return nextValue;
        }

        // 如果是普通对象且传入的是直接值，执行“深度合并”
        if (isObject(nextValue)) {
          // 注意：如果 update 是函数，通常用户已在函数内操作了 draft
          // 根据要求“统一返回新值”，将返回值合并到当前 draft 中
          mergeDeep(draft, nextValue);
        }
      });
    },
    [isUseStateHook, setter],
  );

  return [state, setState];
}

// 启用 useImmer 对 Map 和 Set 集合类型的支持
enableMapSet();
