<template>
  <div class="body-grid">
    <AntAlert
      type="warning"
      show-icon
      message="邮件渠道通常包含附件和多轮抄送，合并到工单前请先确认上下文完整。"
    />

    <AntTimeline :items="timelineItems" />
  </div>
</template>

<script setup lang="ts">
import { Alert as AntAlert, Timeline as AntTimeline } from 'antd';
import { computed } from 'vue';
import type { ConversationDetail, ConversationMessage } from '../data/mock-api';

const props = defineProps<{
  detail: ConversationDetail;
  messages: ConversationMessage[];
}>();

const timelineItems = computed(() =>
  props.messages.map((message) => ({
    key: message.id,
    color: message.sender === 'customer' ? 'blue' : message.sender === 'agent' ? 'green' : 'gold',
    children: `${message.sentAt} · ${message.author} · ${message.content}`,
  })),
);
</script>

<style scoped>
.body-grid {
  display: grid;
  gap: 12px;
}
</style>
