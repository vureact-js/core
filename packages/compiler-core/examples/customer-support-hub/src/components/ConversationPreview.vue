<template>
  <section class="preview-shell">
    <AntSkeleton v-if="props.loading" active :paragraph="{ rows: 8 }" />

    <div v-else-if="props.detail" class="preview-content">
      <slot name="header" :detail="props.detail" :refresh="refreshNow">
        <div class="preview-header">
          <div>
            <h3>{{ props.detail.subject }}</h3>
            <AntSpace wrap>
              <AntTag color="blue">{{ props.detail.channel }}</AntTag>
              <AntTag color="purple">{{ props.detail.queue }}</AntTag>
              <AntTag :color="priorityColor">{{ props.detail.priority }}</AntTag>
              <AntTag v-if="props.detail.linkedTicketId" color="green">
                已关联 {{ props.detail.linkedTicketId }}
              </AntTag>
            </AntSpace>
          </div>

          <AntButton type="link" @click="refreshNow">刷新</AntButton>
        </div>
      </slot>

      <AntAlert
        v-if="props.detail.status === 'escalated'"
        type="error"
        show-icon
        :message="`该会话已进入升级队列，请优先处理并同步工单动作。`"
      />
      <AntAlert
        v-else-if="props.detail.status === 'pending'"
        type="warning"
        show-icon
        :message="`当前挂起原因：${props.detail.waitingReason || '等待客户补充'}。`"
      />
      <AntAlert v-else type="success" show-icon message="当前会话处于可处理状态，可直接执行转派、并单或转工单。" />

      <AntDescriptions :column="2" bordered size="small">
        <AntDescriptionsItem label="客户">{{ props.detail.customerName }}</AntDescriptionsItem>
        <AntDescriptionsItem label="联系方式">{{ props.detail.contact }}</AntDescriptionsItem>
        <AntDescriptionsItem label="当前负责人">{{ props.detail.ownerName || '待分配' }}</AntDescriptionsItem>
        <AntDescriptionsItem label="会话状态">{{ statusText }}</AntDescriptionsItem>
        <AntDescriptionsItem label="创建时间">{{ props.detail.createdAt }}</AntDescriptionsItem>
        <AntDescriptionsItem label="最新触达">{{ props.detail.latestAt }}</AntDescriptionsItem>
      </AntDescriptions>

      <div v-show="props.detail.tags.length" class="tag-row">
        <AntTag v-for="tag in props.detail.tags" :key="tag">{{ tag }}</AntTag>
      </div>

      <slot
        name="actions"
        :detail="props.detail"
        :linkedTicket="props.detail.linkedTicket"
        :suggestedAgents="props.detail.suggestedAgents"
      />

      <component :is="bodyComponent" :detail="props.detail" :messages="props.detail.messages" />
    </div>

    <AntResult v-else status="info" title="选择左侧会话查看详情" sub-title="支持批量转派、挂起和转工单操作。" />
  </section>
</template>

<script setup lang="ts">
import {
  Alert as AntAlert,
  Button as AntButton,
  Descriptions as AntDescriptions,
  Result as AntResult,
  Skeleton as AntSkeleton,
  Space as AntSpace,
  Tag as AntTag,
} from 'antd';
import { computed, inject } from 'vue';
import type { ConversationDetail } from '../data/mock-api';
import ConversationBodyChat from './ConversationBodyChat.vue';
import ConversationBodyEmail from './ConversationBodyEmail.vue';
import ConversationBodyPhone from './ConversationBodyPhone.vue';
import ConversationBodySocial from './ConversationBodySocial.vue';
import {
  activeConversationContextKey,
  type ActiveConversationContext,
} from './conversation-context';

const AntDescriptionsItem = (AntDescriptions as any).Item;

const props = defineProps<{
  detail: ConversationDetail | null;
  loading: boolean;
}>();

const conversationContext = inject<ActiveConversationContext | null>(activeConversationContextKey, null);

const componentMap = {
  chat: ConversationBodyChat,
  email: ConversationBodyEmail,
  phone: ConversationBodyPhone,
  social: ConversationBodySocial,
};

const bodyComponent = computed(() => {
  if (!props.detail) return ConversationBodyChat;
  return componentMap[props.detail.channel];
});

const priorityColor = computed(() => {
  if (!props.detail) return 'default';
  if (props.detail.priority === 'high') return 'red';
  if (props.detail.priority === 'medium') return 'gold';
  return 'blue';
});

const statusText = computed(() => {
  if (!props.detail) return '-';
  if (props.detail.status === 'unassigned') return '待分配';
  if (props.detail.status === 'processing') return '处理中';
  if (props.detail.status === 'pending') return '待客户回复';
  return '待升级';
});

const refreshNow = async () => {
  if (!conversationContext) return;
  await conversationContext.refresh();
};
</script>

<style scoped>
.preview-shell {
  min-height: 320px;
}

.preview-content {
  display: grid;
  gap: 14px;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: start;
}

.preview-header h3 {
  margin: 0 0 8px;
  color: #111827;
}

.tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
</style>
