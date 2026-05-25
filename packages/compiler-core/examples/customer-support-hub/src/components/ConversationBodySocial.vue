<template>
  <div class="body-grid">
    <AntAlert type="error" show-icon message="社媒渠道具备扩散风险，处理前请确认统一口径和升级责任人。" />

    <div class="tag-row">
      <AntTag v-for="tag in props.detail.tags" :key="tag" color="magenta">{{ tag }}</AntTag>
    </div>

    <div class="feed-list">
      <article v-for="item in props.messages" :key="item.id" class="feed-item">
        <div class="feed-head">
          <strong>{{ item.author }} · {{ item.sentAt }}</strong>
          <AntTag :color="item.sender === 'system' ? 'gold' : 'blue'">{{ item.sender }}</AntTag>
        </div>
        <p>{{ item.content }}</p>
      </article>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Alert as AntAlert, Tag as AntTag } from 'antd';
import type { ConversationDetail, ConversationMessage } from '../data/mock-api';

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

.tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.feed-list {
  display: grid;
  gap: 10px;
}

.feed-item {
  border: 1px solid #f0d4df;
  border-radius: 12px;
  padding: 12px;
  background: #fff8fb;
}

.feed-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
}

.feed-item p {
  margin: 6px 0 0;
  color: #4b5563;
  line-height: 1.6;
}
</style>
