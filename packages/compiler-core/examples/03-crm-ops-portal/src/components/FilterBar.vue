<template>
  <div class="filter-bar">
    <input
      class="input"
      :value="props.modelValue"
      placeholder="搜索客户或负责人"
      @input="onInput"
    />
    <select class="select" :value="props.status" @change="onStatusChange">
      <option value="all">全部状态</option>
      <option value="活跃">活跃</option>
      <option value="沉默">沉默</option>
      <option value="流失">流失</option>
    </select>
  </div>
</template>

<script setup lang="ts">
// @vr-name: FilterBar
const props = defineProps<{ modelValue: string; status: string }>();
const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
  (e: 'update:status', value: string): void;
}>();

function onInput(event: Event) {
  const target = event.target as HTMLInputElement;
  emit('update:modelValue', target.value);
}

function onStatusChange(event: Event) {
  const target = event.target as HTMLSelectElement;
  emit('update:status', target.value);
}
</script>

<style scoped>
.filter-bar {
  display: flex;
  gap: 12px;
}

.input,
.select {
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: #fff;
  min-width: 180px;
}
</style>
