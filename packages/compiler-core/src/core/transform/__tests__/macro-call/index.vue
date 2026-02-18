<template>
  Hello {{ props.title }}
  {{ $props.title }}

  <!-- 应将 emit('change') 替换为 props?.onChange() -->
  <button @click="() => emit('change')"></button>

  <!-- 应将 emit('update', count++) 替换为 
   props?.onUpdate({ value: count.value++ }) -->
  <button @click="emit('update', { value: count++ }, 1)"></button>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps<{ title: string }>();
const emit = defineEmits<{
  (e: 'change'): void;
  (e: 'update', arg: { value: number }, d?: number): number;
}>();

const count = ref(1);

// 应分析依赖，得到 props?.onUpdate
const handleUpdate = () => {
  // 应替换成 props?.onUpdate({ value: count.value++ })
  emit('update', { value: count.value });
};
</script>
