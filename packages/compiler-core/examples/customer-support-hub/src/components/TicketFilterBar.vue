<template>
  <div class="bar">
    <label>
      关键词
      <input :value="props.keyword" @input="onKeyword" placeholder="工单号/客户/标题" />
    </label>
    <label>
      状态
      <select :value="props.status" @change="onStatus">
        <option value="all">全部</option>
        <option value="open">待处理</option>
        <option value="processing">处理中</option>
        <option value="resolved">已解决</option>
        <option value="closed">已关闭</option>
      </select>
    </label>
    <label>
      优先级
      <select :value="props.priority" @change="onPriority">
        <option value="all">全部</option>
        <option value="high">高</option>
        <option value="medium">中</option>
        <option value="low">低</option>
      </select>
    </label>
    <label>
      负责人
      <select :value="props.owner" @change="onOwner">
        <option value="all">全部</option>
        <option v-for="owner in props.owners" :key="owner" :value="owner">{{ owner }}</option>
      </select>
    </label>
  </div>
</template>

<script setup lang="ts">
// @vr-name: TicketFilterBar
const props = defineProps<{
  keyword: string;
  status: string;
  priority: string;
  owner: string;
  owners: string[];
}>();

const emit = defineEmits<{
  (e: 'update:keyword', value: string): void;
  (e: 'update:status', value: string): void;
  (e: 'update:priority', value: string): void;
  (e: 'update:owner', value: string): void;
}>();

const onKeyword = (event: Event) => emit('update:keyword', (event.target as HTMLInputElement).value);
const onStatus = (event: Event) => emit('update:status', (event.target as HTMLSelectElement).value);
const onPriority = (event: Event) => emit('update:priority', (event.target as HTMLSelectElement).value);
const onOwner = (event: Event) => emit('update:owner', (event.target as HTMLSelectElement).value);
</script>

<style scoped>
.bar {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 10px;
}

label {
  display: grid;
  gap: 6px;
  font-size: 12px;
  color: var(--muted);
}

input,
select {
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 8px 10px;
}
</style>
