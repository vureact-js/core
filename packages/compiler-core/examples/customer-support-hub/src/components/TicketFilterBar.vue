<template>
  <AntForm layout="inline" class-name="ticket-filter-bar">
    <AntFormItem label="关键词">
      <AntInput :value="props.keyword" allow-clear placeholder="工单号/客户/标题" @change="onKeyword" />
    </AntFormItem>

    <AntFormItem label="状态">
      <AntSelect :value="props.status" style="min-width: 120px" :options="statusOptions" @change="onStatus" />
    </AntFormItem>

    <AntFormItem label="优先级">
      <AntSelect :value="props.priority" style="min-width: 120px" :options="priorityOptions" @change="onPriority" />
    </AntFormItem>

    <AntFormItem label="负责人">
      <AntSelect :value="props.owner" style="min-width: 140px" :options="ownerOptions" @change="onOwner" />
    </AntFormItem>
  </AntForm>
</template>

<script setup lang="ts">
// @vr-name: TicketFilterBar
import { Form as AntForm, Input as AntInput, Select as AntSelect } from 'antd';
import { computed } from 'vue';

const AntFormItem = (AntForm as any).Item;

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

const statusOptions = [
  { label: '全部', value: 'all' },
  { label: '待处理', value: 'open' },
  { label: '处理中', value: 'processing' },
  { label: '已解决', value: 'resolved' },
  { label: '已关闭', value: 'closed' },
];

const priorityOptions = [
  { label: '全部', value: 'all' },
  { label: '高', value: 'high' },
  { label: '中', value: 'medium' },
  { label: '低', value: 'low' },
];

const ownerOptions = computed(() => [
  { label: '全部', value: 'all' },
  ...props.owners.map((owner) => ({ label: owner, value: owner })),
]);

const onKeyword = (event: any) => emit('update:keyword', event?.target?.value || '');
const onStatus = (value: any) => emit('update:status', value || 'all');
const onPriority = (value: any) => emit('update:priority', value || 'all');
const onOwner = (value: any) => emit('update:owner', value || 'all');
</script>

<style scoped>
.ticket-filter-bar {
  row-gap: 10px;
}
</style>
