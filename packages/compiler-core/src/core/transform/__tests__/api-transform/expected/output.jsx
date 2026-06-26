import { memo } from 'react';
import { useVRef, useReactive, useComputed, useWatch, useBeforeMount, Provider, useUpdated, useWatchEffect } from '@vureact/runtime-core';
const Input = memo(() => {
  const count = useVRef(2);
  const state = useReactive({
    count: 2
  });
  const result = useComputed(() => (count.value + state.count) * 0.5);
  const r = useVRef;
  useReactive;
  useReactive({
    value: 2
  });
  useWatch;
  useBeforeMount(() => {
    console.log('object');
  });
  useUpdated(() => {
    count.value++;
  }, [count.value]);
  useWatch(() => count, (newVal, oldVal) => {});
  useWatchEffect;
  useWatchEffect(onCleanup => {
    onCleanup(() => {});
    result.value;
  }, [result.value]);
  return <><Provider name={batchActionContextKey} value={{
      queue: useComputed(() => filters.value.queue),
      status: useComputed(() => filters.value.status)
    }} /></>;
});
export default Input;