<template>
  <AntTag :color="color">{{ text }}</AntTag>
</template>

<script setup lang="ts">
// @vr-name: TicketStatusTag
import { Tag as AntTag } from 'antd';
import { computed } from 'vue';

const props = defineProps<{ status: 'open' | 'processing' | 'resolved' | 'closed' }>();

const text = computed(() => {
  if (props.status === 'open') return '待处理';
  if (props.status === 'processing') return '处理中';
  if (props.status === 'resolved') return '已解决';
  return '已关闭';
});

const color = computed(() => {
  if (props.status === 'open') return 'volcano';
  if (props.status === 'processing') return 'gold';
  if (props.status === 'resolved') return 'green';
  return 'default';
});
</script>
