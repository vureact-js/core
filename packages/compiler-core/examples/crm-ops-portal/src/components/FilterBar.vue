<template>
  <div class="filter-bar">
    <div class="field">
      <label>关键词</label>
      <input
        class="input"
        :value="props.modelValue"
        placeholder="搜索客户或负责人"
        @input="onInput"
      />
    </div>
    <div class="field">
      <label>状态</label>
      <select class="select" :value="props.status" @change="onStatusChange">
        <option value="all">全部状态</option>
        <option value="活跃">活跃</option>
        <option value="沉默">沉默</option>
        <option value="流失">流失</option>
      </select>
    </div>
    <div class="field">
      <label>分层</label>
      <select class="select" :value="props.segment" @change="onSegmentChange">
        <option value="all">全部层级</option>
        <option value="重点">重点</option>
        <option value="成长">成长</option>
        <option value="观察">观察</option>
        <option value="流失">流失</option>
      </select>
    </div>
  </div>
</template>

<script setup lang="ts">
// @vr-name: FilterBar
const props = defineProps<{ modelValue: string; status: string; segment: string }>();
const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
  (e: 'update:status', value: string): void;
  (e: 'update:segment', value: string): void;
}>();

function onInput(event: Event) {
  const target = event.target as HTMLInputElement;
  emit('update:modelValue', target.value);
}

function onStatusChange(event: Event) {
  const target = event.target as HTMLSelectElement;
  emit('update:status', target.value);
}

function onSegmentChange(event: Event) {
  const target = event.target as HTMLSelectElement;
  emit('update:segment', target.value);
}
</script>

<style scoped>
.filter-bar {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
}

.field {
  display: grid;
  gap: 6px;
  font-size: 12px;
  color: var(--muted);
}

.input,
.select {
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: #fff;
}
</style>
