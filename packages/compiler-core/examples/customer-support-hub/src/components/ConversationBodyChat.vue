<template>
  <div class="body-grid">
    <AntAlert type="info" show-icon message="在线会话节奏较快，优先关注最近 15 分钟内的未读消息。" />

    <div class="message-list">
      <article
        v-for="message in props.messages"
        :key="message.id"
        class="message-item"
        :class="{ 'is-agent': message.sender === 'agent' }"
      >
        <header class="message-head">
          <strong>{{ message.author }}</strong>
          <span>{{ message.sentAt }}</span>
        </header>
        <p>{{ message.content }}</p>
      </article>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Alert as AntAlert } from 'antd';
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

.message-list {
  display: grid;
  gap: 10px;
}

.message-item {
  border: 1px solid #e5ebf5;
  border-radius: 12px;
  padding: 12px;
  background: #fff;
}

.message-item.is-agent {
  background: #f5f9ff;
}

.message-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 6px;
  color: #6b7280;
}

p {
  margin: 0;
  color: #1f2937;
  line-height: 1.6;
}
</style>
