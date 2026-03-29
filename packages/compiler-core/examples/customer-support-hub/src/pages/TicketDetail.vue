<template>
  <section class="page" v-if="ticket">
    <PagePanel :title="`${ticket.id} · ${ticket.title}`">
      <template #extra>
        <TicketStatusTag :status="ticket.status" />
      </template>

      <div class="meta">
        <span>客户：{{ ticket.customer }}</span>
        <span>负责人：{{ ticket.owner }}</span>
        <span>优先级：{{ ticket.priority }}</span>
        <span>截止：{{ ticket.dueAt }}</span>
      </div>

      <p class="summary">{{ ticket.summary }}</p>

      <div class="actions">
        <AntButton @click="update('open')">设为待处理</AntButton>
        <AntButton @click="update('processing')">设为处理中</AntButton>
        <AntButton type="primary" @click="update('resolved')">标记已解决</AntButton>
        <AntButton danger @click="update('closed')">关闭工单</AntButton>
      </div>
    </PagePanel>
  </section>
</template>

<script setup lang="ts">
// @vr-name: TicketDetail
import { Button as AntButton } from 'antd';
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import PagePanel from '../components/PagePanel.vue';
import TicketStatusTag from '../components/TicketStatusTag.vue';
import { fetchTicketDetail, type Ticket, updateTicketStatus } from '../data/mock-api';

const route = useRoute();
const ticket = ref<Ticket | null>(null);

const load = async () => {
  const id = route.params.id as string;
  ticket.value = await fetchTicketDetail(id);
};

const update = async (status: Ticket['status']) => {
  if (!ticket.value) return;
  ticket.value = await updateTicketStatus(ticket.value.id, status);
};

onMounted(load);
</script>

<style scoped>
.page {
  display: grid;
}

.meta {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 10px;
  font-size: 12px;
  color: var(--muted);
}

.summary {
  margin: 14px 0;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
</style>
