<template>
  <section class="page-grid">
    <AntRow :gutter="[12, 12]">
      <AntCol :xs="24" :md="12" :xl="6">
        <KpiCard label="待处理" :value="summary.openCount" desc="待接单工单" />
      </AntCol>
      <AntCol :xs="24" :md="12" :xl="6">
        <KpiCard label="处理中" :value="summary.processingCount" desc="正在推进" />
      </AntCol>
      <AntCol :xs="24" :md="12" :xl="6">
        <KpiCard label="今日解决" :value="summary.resolvedToday" desc="24h 内已完成" />
      </AntCol>
      <AntCol :xs="24" :md="12" :xl="6">
        <KpiCard label="SLA 风险" :value="summary.slaRisk" desc="需优先关注" />
      </AntCol>
    </AntRow>

    <AntRow :gutter="[12, 12]">
      <AntCol :xs="24" :xl="14">
        <PagePanel title="待处理工单">
          <AntTable
            :columns="todoColumns"
            :data-source="summary.todoTickets"
            :pagination="false"
            row-key="id"
            size="small"
          />
        </PagePanel>
      </AntCol>

      <AntCol :xs="24" :xl="10">
        <PagePanel title="坐席负载排行">
          <AntTable
            :columns="workloadColumns"
            :data-source="summary.agentWorkload"
            :pagination="false"
            row-key="id"
            size="small"
          />
        </PagePanel>
      </AntCol>
    </AntRow>

    <PagePanel title="最近动态">
      <template #extra>
        <RouterLink to="/tickets">查看工单</RouterLink>
      </template>
      <TicketTimeline :items="summary.recentActivities" />
      <EmptyState v-if="!summary.recentActivities.length" text="暂无动态" />
    </PagePanel>
  </section>
</template>

<script setup lang="ts">
// @vr-name: SupportDashboard
import { Col as AntCol, Row as AntRow, Table as AntTable } from 'antd';
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
  todoTickets: [] as any[],
  agentWorkload: [] as any[],
  recentActivities: [] as { id: string; text: string; time: string }[],
});

const todoColumns = [
  { title: '工单号', dataIndex: 'id', key: 'id' },
  { title: '标题', dataIndex: 'title', key: 'title' },
  { title: '负责人', dataIndex: 'owner', key: 'owner' },
  { title: '截止时间', dataIndex: 'dueAt', key: 'dueAt' },
  { title: '状态', dataIndex: 'status', key: 'status' },
];

const workloadColumns = [
  { title: '坐席', dataIndex: 'name', key: 'name' },
  { title: '状态', dataIndex: 'status', key: 'status' },
  { title: '负载', dataIndex: 'load', key: 'load' },
  { title: '今日处理', dataIndex: 'handledToday', key: 'handledToday' },
];

onMounted(async () => {
  summary.value = await fetchDashboardSummary();
});
</script>

<style scoped>
.page-grid {
  display: grid;
  gap: 12px;
}
</style>
