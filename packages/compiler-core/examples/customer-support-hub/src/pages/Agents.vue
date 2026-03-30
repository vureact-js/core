<template>
  <section class="page-grid">
    <PagePanel title="坐席管理">
      <template #extra>
        <AntSpace>
          <AntInput :value="keyword" allow-clear placeholder="搜索坐席/团队" @change="onKeyword" />
          <AntSelect
            :value="status"
            style="width: 140px"
            :options="statusOptions"
            @change="onStatus"
          />
        </AntSpace>
      </template>

      <AntTable :columns="columns" :data-source="rows" row-key="id" :loading="loading" />

      <AntDivider />
      <AntSpace wrap>
        <AntSelect
          :value="selectedAgentId"
          style="width: 240px"
          placeholder="选择坐席"
          :options="agentOptions"
          @change="onAgentChange"
        />
        <AntSelect
          :value="selectedTicketId"
          style="width: 320px"
          placeholder="选择待处理工单"
          :options="ticketOptions"
          @change="onTicketChange"
        />
        <AntButton type="primary" :disabled="!selectedAgentId || !selectedTicketId" @click="submitAssign">分配工单</AntButton>
      </AntSpace>
    </PagePanel>

    <PagePanel title="坐席绩效分段统计">
      <AntTable
        :columns="performanceColumns"
        :data-source="performanceBands"
        row-key="band"
        :pagination="false"
      />
    </PagePanel>

    <PagePanel title="个人绩效趋势（7日）">
      <template #extra>
        <AntSelect
          :value="selectedTrendAgentId"
          style="width: 240px"
          placeholder="选择坐席查看趋势"
          :options="agentOptions"
          @change="onTrendAgentChange"
        />
      </template>

      <AntSpace wrap>
        <AntTag color="blue">坐席：{{ trendAgentName }}</AntTag>
        <AntTag color="purple">团队：{{ trendAgentTeam }}</AntTag>
      </AntSpace>

      <div class="trend-grid">
        <div v-for="day in weeklyTrend" :key="day.date" class="trend-card">
          <div class="trend-title">{{ day.date }}</div>
          <div class="trend-row">
            <span>处理量</span>
            <span>{{ day.handled }}</span>
          </div>
          <AntProgress :percent="day.efficiency" :show-info="false" />
          <div class="trend-row">
            <span>响应时长(分钟)</span>
            <span>{{ day.response }}</span>
          </div>
          <div class="trend-row">
            <span>质量分</span>
            <span>{{ day.qualityScore }}</span>
          </div>
        </div>
      </div>
    </PagePanel>
  </section>
</template>

<script setup lang="ts">
// @vr-name: AgentsPage
import {
  Button as AntButton,
  Divider as AntDivider,
  Input as AntInput,
  Progress as AntProgress,
  Select as AntSelect,
  Space as AntSpace,
  Table as AntTable,
  Tag as AntTag,
  message,
} from 'antd';
import { computed, onMounted, ref } from 'vue';
import PagePanel from '../components/PagePanel.vue';
import {
  assignTicket,
  fetchAgentPerformanceBands,
  fetchAgentWeeklyTrend,
  fetchAgents,
  fetchTickets,
} from '../data/mock-api';

const rows = ref<any[]>([]);
const loading = ref(false);
const keyword = ref('');
const status = ref('all');

const selectedAgentId = ref('');
const selectedTicketId = ref('');
const openTickets = ref<any[]>([]);
const performanceBands = ref<any[]>([]);

const selectedTrendAgentId = ref('');
const trendAgentName = ref('');
const trendAgentTeam = ref('');
const weeklyTrend = ref<Array<{ date: string; handled: number; response: number; qualityScore: number; efficiency: number }>>([]);

const columns = [
  { title: '坐席', dataIndex: 'name', key: 'name' },
  { title: '团队', dataIndex: 'team', key: 'team' },
  { title: '状态', dataIndex: 'status', key: 'status' },
  { title: '当前负载', dataIndex: 'currentLoad', key: 'currentLoad' },
  { title: '平均响应(分钟)', dataIndex: 'avgResponseMinutes', key: 'avgResponseMinutes' },
  { title: '今日处理', dataIndex: 'handledToday', key: 'handledToday' },
  { title: '操作', dataIndex: 'operationHint', key: 'operationHint' },
];

const performanceColumns = [
  { title: '绩效段', dataIndex: 'band', key: 'band' },
  { title: '名称', dataIndex: 'title', key: 'title' },
  { title: '说明', dataIndex: 'desc', key: 'desc' },
  { title: '人数', dataIndex: 'count', key: 'count' },
  { title: '平均日处理', dataIndex: 'avgHandled', key: 'avgHandled' },
  { title: '平均响应(分钟)', dataIndex: 'avgResponse', key: 'avgResponse' },
  { title: '覆盖率', dataIndex: 'coverageText', key: 'coverageText' },
];

const statusOptions = [
  { label: '全部状态', value: 'all' },
  { label: '在线', value: 'online' },
  { label: '繁忙', value: 'busy' },
  { label: '离线', value: 'offline' },
];

const agentOptions = computed(() =>
  rows.value
    .filter((item) => item.status !== 'offline')
    .map((item) => ({ value: item.id, label: `${item.name} | ${item.team}` })),
);

const ticketOptions = computed(() =>
  openTickets.value.map((item) => ({
    value: item.id,
    label: `${item.id} | ${item.title}`,
  })),
);

const loadWeeklyTrend = async (agentId: string) => {
  if (!agentId) {
    trendAgentName.value = '';
    trendAgentTeam.value = '';
    weeklyTrend.value = [];
    return;
  }

  const data = await fetchAgentWeeklyTrend(agentId);
  trendAgentName.value = data.agentName;
  trendAgentTeam.value = data.team;
  weeklyTrend.value = data.days;
};

const reload = async () => {
  loading.value = true;
  try {
    const agents = await fetchAgents({ status: status.value as any, keyword: keyword.value });
    rows.value = agents.map((item) => ({
      ...item,
      operationHint: item.status === 'offline' ? '离线，不可分配' : '可分配工单',
    }));

    const tickets = await fetchTickets({ status: 'open', page: 1, pageSize: 50 });
    openTickets.value = tickets.list;

    const bandRows = await fetchAgentPerformanceBands();
    performanceBands.value = bandRows.map((item: any) => ({
      ...item,
      coverageText: `${item.coverage}%`,
    }));

    if (selectedAgentId.value && !rows.value.find((item) => item.id === selectedAgentId.value)) {
      selectedAgentId.value = '';
    }

    if (
      selectedTicketId.value &&
      !openTickets.value.find((item) => item.id === selectedTicketId.value)
    ) {
      selectedTicketId.value = '';
    }

    const canUseTrendAgent = rows.value.find((item) => item.id === selectedTrendAgentId.value);
    if (!canUseTrendAgent) {
      selectedTrendAgentId.value = rows.value.find((item) => item.status !== 'offline')?.id || '';
    }

    await loadWeeklyTrend(selectedTrendAgentId.value);
  } finally {
    loading.value = false;
  }
};

const onKeyword = (event: any) => {
  keyword.value = event?.target?.value || '';
  reload();
};

const onStatus = (value: any) => {
  status.value = value || 'all';
  reload();
};

const onAgentChange = (value: any) => {
  selectedAgentId.value = value || '';
};

const onTicketChange = (value: any) => {
  selectedTicketId.value = value || '';
};

const onTrendAgentChange = (value: any) => {
  selectedTrendAgentId.value = value || '';
  loadWeeklyTrend(selectedTrendAgentId.value);
};

const submitAssign = async () => {
  if (!selectedAgentId.value || !selectedTicketId.value) {
    message.error('请选择坐席和待分配工单');
    return;
  }

  await assignTicket({
    ticketId: selectedTicketId.value,
    agentId: selectedAgentId.value,
  });

  message.success('工单分配成功');
  reload();
};

onMounted(reload);
</script>

<style scoped>
.page-grid {
  display: grid;
  gap: 12px;
}

.trend-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 10px;
  margin-top: 10px;
}

.trend-card {
  border: 1px solid #eef2f8;
  border-radius: 8px;
  padding: 10px;
}

.trend-title {
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 8px;
}

.trend-row {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #4a5568;
  margin: 6px 0;
}
</style>
