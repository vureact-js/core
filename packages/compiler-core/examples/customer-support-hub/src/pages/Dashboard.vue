<template>
  <section class="page">
    <div class="kpi-grid">
      <KpiCard label="待处理" :value="summary.openCount" desc="需分配处理人" />
      <KpiCard label="处理中" :value="summary.processingCount" desc="进行中的工单" />
      <KpiCard label="今日解决" :value="summary.resolvedToday" desc="过去 24 小时" />
      <KpiCard label="SLA 风险" :value="summary.slaRisk" desc="60 分钟内到期" />
    </div>

    <PagePanel title="最近动态">
      <template #extra>
        <RouterLink to="/tickets" class="link">查看工单</RouterLink>
      </template>

      <TicketTimeline :items="summary.recentActivities" />
      <EmptyState v-if="!summary.recentActivities.length" text="暂无动态" />
    </PagePanel>
  </section>
</template>

<script setup lang="ts">
// @vr-name: SupportDashboard
import { onMounted, ref } from 'vue';
import EmptyState from '../components/EmptyState.vue';
import KpiCard from '../components/KpiCard.vue';
import PagePanel from '../components/PagePanel.vue';
import TicketTimeline from '../components/TicketTimeline.vue';
import { fetchDashboardSummary } from '../data/mock-api';

const summary = ref({
  openCount: 0,
  processingCount: 0,
  resolvedToday: 0,
  slaRisk: 0,
  recentActivities: [] as { id: string; text: string; time: string }[],
});

onMounted(async () => {
  summary.value = await fetchDashboardSummary();
});
</script>

<style scoped>
.page {
  display: grid;
  gap: 16px;
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 10px;
}

.link {
  color: var(--accent);
  font-size: 12px;
}
</style>
