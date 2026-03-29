<template>
  <section class="page">
    <PagePanel title="SLA 看板">
      <div class="grid" v-if="rows.length">
        <div v-for="row in rows" :key="row.id" class="card">
          <div class="head">
            <strong>{{ row.id }}</strong>
            <TicketStatusTag :status="row.status" />
          </div>
          <p>{{ row.title }}</p>
          <SlaMeter
            :percent="row.progressPercent"
            :label="row.remainMinutes > 0 ? `剩余 ${row.remainMinutes} 分钟` : '已超时'"
            :status="row.risk === 'risk' ? 'exception' : row.risk === 'done' ? 'success' : 'normal'"
          />
        </div>
      </div>
      <EmptyState v-else text="暂无 SLA 数据" />
    </PagePanel>
  </section>
</template>

<script setup lang="ts">
// @vr-name: SlaBoard
import { onMounted, ref } from 'vue';
import EmptyState from '../components/EmptyState.vue';
import PagePanel from '../components/PagePanel.vue';
import SlaMeter from '../components/SlaMeter.vue';
import TicketStatusTag from '../components/TicketStatusTag.vue';
import { fetchSlaBoard } from '../data/mock-api';

const rows = ref<
  {
    id: string;
    title: string;
    status: 'open' | 'processing' | 'resolved' | 'closed';
    remainMinutes: number;
    progressPercent: number;
    risk: 'risk' | 'safe' | 'done';
  }[]
>([]);

onMounted(async () => {
  const data = await fetchSlaBoard();
  rows.value = data.rows;
});
</script>

<style scoped>
.page {
  display: grid;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 10px;
}

.card {
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 10px;
  background: #fff;
  display: grid;
  gap: 8px;
}

.head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

p {
  margin: 0;
  font-size: 13px;
}
</style>
