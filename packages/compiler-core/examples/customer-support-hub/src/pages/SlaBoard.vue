<template>
  <section class="page-grid">
    <PagePanel title="SLA 看板">
      <template #extra>
        <AntRadioGroup :value="riskFilter" @change="onFilterChange">
          <AntRadioButton value="all">全部</AntRadioButton>
          <AntRadioButton value="risk">风险</AntRadioButton>
          <AntRadioButton value="timeout">已超时</AntRadioButton>
        </AntRadioGroup>
      </template>

      <AntTable :columns="columns" :data-source="tableRows" row-key="id" :pagination="false" />

      <EmptyState v-if="!tableRows.length" text="暂无 SLA 数据" />
    </PagePanel>
  </section>
</template>

<script setup lang="ts">
// @vr-name: SlaBoard
import { Radio as AntRadio, Table as AntTable } from 'antd';
import { computed, onMounted, ref } from 'vue';
import EmptyState from '../components/EmptyState.vue';
import PagePanel from '../components/PagePanel.vue';
import { fetchSlaBoard } from '../data/mock-api';

const AntRadioGroup = (AntRadio as any).Group;
const AntRadioButton = (AntRadio as any).Button;

const rows = ref<any[]>([]);
const riskFilter = ref<'all' | 'risk' | 'timeout'>('all');

const columns = [
  { title: '工单号', dataIndex: 'id', key: 'id' },
  { title: '标题', dataIndex: 'title', key: 'title' },
  { title: '负责人', dataIndex: 'owner', key: 'owner' },
  { title: '状态', dataIndex: 'status', key: 'status' },
  { title: '截止时间', dataIndex: 'dueAt', key: 'dueAt' },
  { title: '剩余分钟', dataIndex: 'remainMinutes', key: 'remainMinutes' },
  { title: '进度(%)', dataIndex: 'progressPercent', key: 'progressPercent' },
  { title: '升级', dataIndex: 'escalationText', key: 'escalationText' },
  { title: '风险', dataIndex: 'riskText', key: 'riskText' },
];

const tableRows = computed(() => {
  if (riskFilter.value === 'risk') {
    return rows.value.filter((item) => item.risk === 'risk');
  }

  if (riskFilter.value === 'timeout') {
    return rows.value.filter((item) => item.remainMinutes <= 0 && item.risk !== 'done');
  }

  return rows.value;
});

const onFilterChange = (event: any) => {
  riskFilter.value = (event?.target?.value || 'all') as 'all' | 'risk' | 'timeout';
};

onMounted(async () => {
  const data = await fetchSlaBoard();
  rows.value = data.rows;
});
</script>

<style scoped>
.page-grid {
  display: grid;
}
</style>
