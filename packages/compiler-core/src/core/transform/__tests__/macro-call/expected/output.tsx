import { type ReactNode, useCallback, memo } from 'react';
import { useVRef } from '@vureact/runtime-core';
interface SomeTypes {
  name: string;
  class?: () => string;
  click: () => any;
  change: (v: string) => string;
}
export type ICompProps = {
  title: string;
} & {
  onChange?: () => void;
  onUpdate?: (arg: {
    value: number;
  }, d?: number) => number;
} & {
  children?: ReactNode;
  header?: (props: {
    title: string;
  }) => ReactNode;
  footer?: (props: {
    year: number;
  }) => ReactNode;
  item?: (props: {
    id: number;
    name: string;
  }) => ReactNode;
};
const Input = memo((props: ICompProps) => {
  const count = useVRef(1);

  // 应分析依赖，得到 props?.onUpdate
  const handleUpdate = useCallback(() => {
    // 应替换成 props?.onUpdate({ value: count.value++ })
    props.onUpdate?.({
      value: count.value
    });
    const update = 'update';
    props[update]?.({
      value: count.value
    });
  }, [props.onUpdate, count.value, props]);
  return <>Hello{props.title}{/* 应将 emit('change') 替换为 props?.onChange() */}<button onClick={() => {
      props.onChange?.();
    }} />{/* 应将 emit('update', count.value++) 替换为 
   props?.onUpdate({ value: count.value++ }) */}<button onClick={() => {
      props.onUpdate?.({
        value: count.value++
      }, 1);
    }} /></>;
});
export default Input;