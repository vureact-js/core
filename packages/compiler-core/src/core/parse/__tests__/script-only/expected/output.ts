import { useVRef, useComputed, useReactive, useMounted, useUnmounted, useWatchEffect } from "@vureact/runtime-core";
// 测试 Vue Composition API 转换为 React Hooks
// 注意，这样的写法转成 React 完全不符合规则，仅测试用。

// 测试 ref
const count = useVRef(0);
const message = useVRef('Hello');

// 测试 computed
const doubleCount = useComputed(() => count.value * 2);

// 测试 reactive
const state = useReactive({
  name: 'Test',
  items: [1]
});

// 测试函数
function increment() {
  count.value++;
  state.items.push(count.value);
}

// 测试 watchEffect

useWatchEffect(() => {
  console.log('Count changed:', count.value);
}, [count.value]);

// 测试生命周期

useMounted(() => {
  console.log('Component mounted');
});
useUnmounted(() => {
  console.log('Component unmounted');
});

// 测试 defineProps 和 defineEmits

function handleUpdate() {
  emit('update', {
    value: count.value
  });
}

// 导出供测试
export { count, doubleCount, emit, handleUpdate, increment, message, props, state };