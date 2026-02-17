// 测试 Vue Composition API 转换为 React Hooks
// 注意，这样的写法转成 React 完全不符合规则，仅测试用。

import { computed, onMounted, onUnmounted, reactive, ref, watchEffect } from 'vue';

// 测试 defineProps 和 defineEmits
const props = defineProps({
  title: String,
  count: Number,
});

const emit = defineEmits(['update', 'delete']);

// 测试 ref
const count = ref(0);
const message = ref('Hello');

// 测试 computed
const doubleCount = computed(() => count.value * 2);

// 测试 reactive
const state = reactive({
  name: 'Test',
  items: [1],
});

// 测试函数
function increment() {
  count.value++;
  state.items.push(count.value);
}

// 测试 watchEffect
watchEffect(() => {
  console.log('Count changed:', count.value);
});

// 测试生命周期
onMounted(() => {
  console.log('Component mounted');
});

onUnmounted(() => {
  console.log('Component unmounted');
});

function handleUpdate() {
  emit('update', { value: count.value });
}

// 导出供测试
export { count, doubleCount, emit, handleUpdate, increment, message, props, state };
