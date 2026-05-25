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

    <AntRow :gutter="[12, 12]">
      <AntCol :xs="24" :xl="8">
        <PagePanel title="渠道分布">
          <AntTable
            :columns="channelColumns"
            :data-source="summary.channelSummary"
            :pagination="false"
            row-key="channel"
            size="small"
          />
        </PagePanel>
      </AntCol>

      <AntCol :xs="24" :xl="8">
        <PagePanel title="待回复会话">
          <template #extra>
            <RouterLink to="/conversations">进入会话中心</RouterLink>
          </template>
          <AntTable
            :columns="conversationColumns"
            :data-source="summary.pendingConversations"
            :pagination="false"
            row-key="id"
            size="small"
          />
        </PagePanel>
      </AntCol>

      <AntCol :xs="24" :xl="8">
        <PagePanel title="升级热点客户">
          <AntTable
            :columns="customerColumns"
            :data-source="summary.hotspotCustomers"
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
// @vr-name: Dashboard
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
  channelSummary: [] as any[],
  pendingConversations: [] as any[],
  hotspotCustomers: [] as any[],
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

const channelColumns = [
  { title: '渠道', dataIndex: 'channel', key: 'channel' },
  { title: '总量', dataIndex: 'total', key: 'total' },
  { title: '待分配', dataIndex: 'unassigned', key: 'unassigned' },
  { title: '待升级', dataIndex: 'escalated', key: 'escalated' },
];

const conversationColumns = [
  { title: '会话号', dataIndex: 'id', key: 'id' },
  { title: '客户', dataIndex: 'customerName', key: 'customerName' },
  { title: '队列', dataIndex: 'queue', key: 'queue' },
  { title: '状态', dataIndex: 'status', key: 'status' },
];

const customerColumns = [
  { title: '客户', dataIndex: 'name', key: 'name' },
  { title: '风险分', dataIndex: 'riskScore', key: 'riskScore' },
  { title: '升级数', dataIndex: 'escalations', key: 'escalations' },
  { title: '活跃会话', dataIndex: 'activeConversations', key: 'activeConversations' },
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
