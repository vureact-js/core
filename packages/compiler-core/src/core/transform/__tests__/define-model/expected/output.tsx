// @ts-nocheck
import { useVRef } from '@vureact/runtime-core';
import { memo, useCallback, useEffect } from 'react';
export type IChildProps = {
  state?: string;
  modelValue?: string;
  count: number;
} & {
  onUpdateState?: (arg: string) => void;
  onUpdateModelValue?: (arg: string) => void;
  onUpdateCount?: (arg: number) => void;
};
const Child = memo((props: IChildProps) => {
  // 声明 "state" prop，由父组件通过 v-model:state 使用
  const state = useVRef<string>(props.state);

  // 声明带选项的 "modelValue" prop，由父组件通过 v-model 使用
  const modelValue = useVRef<string>(props.modelValue ?? 'xxx');

  // 声明带选项的 "count" prop，由父组件通过 v-model:count  使用
  const count = useVRef<number>(props.count ?? 0);

  // 在被修改时，触发 "update:state" 事件
  state.value = 'hello';
  const inc = useCallback(() => {
    // 在被修改时，触发 "update:count" 事件
    count.value++;
  }, [count.value]);
  useEffect(() => {
    props.onUpdateState?.(state.value);
  }, [state.value]);
  useEffect(() => {
    props.onUpdateModelValue?.(modelValue.value);
  }, [modelValue.value]);
  useEffect(() => {
    props.onUpdateCount?.(count.value);
  }, [count.value]);
  return (
    <>
      <input
        value={modelValue}
        onChange={(e) => {
          modelValue = e.target.value;
        }}
      />
      <div>Parent bound v-model is:{count}</div>
      <button onClick={inc}>Increment</button>
    </>
  );
});
export default Child;
