<template>
  <div class="body-grid">
    <AntDescriptions bordered :column="1" size="small">
      <AntDescriptionsItem label="联系电话">{{ props.detail.contact }}</AntDescriptionsItem>
      <AntDescriptionsItem label="当前状态">{{ props.detail.status }}</AntDescriptionsItem>
      <AntDescriptionsItem label="最新摘要">{{ props.detail.latestMessage }}</AntDescriptionsItem>
    </AntDescriptions>

    <div class="call-log">
      <article v-for="item in props.messages" :key="item.id" class="call-item">
        <strong>{{ item.author }} · {{ item.sentAt }}</strong>
        <p>{{ item.content }}</p>
      </article>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Descriptions as AntDescriptions } from 'antd';
import type { ConversationDetail, ConversationMessage } from '../data/mock-api';

const AntDescriptionsItem = (AntDescriptions as any).Item;

const props = defineProps<{
  detail: ConversationDetail;
  messages: ConversationMessage[];
}>();
</script>

<style scoped>
.body-grid {
  display: grid;
  gap: 12px;
}

.call-log {
  display: grid;
  gap: 10px;
}

.call-item {
  border: 1px solid #e5ebf5;
  border-radius: 12px;
  padding: 12px;
  background: #fff;
}

.call-item p {
  margin: 6px 0 0;
  color: #4b5563;
  line-height: 1.6;
}
</style>
