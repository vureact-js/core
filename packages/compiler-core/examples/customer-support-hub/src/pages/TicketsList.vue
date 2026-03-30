<template>
  <section class="page-grid">
    <PagePanel title="工单筛选">
      <TicketFilterBar
        :keyword="filters.keyword"
        :status="filters.status"
        :priority="filters.priority"
        :owner="filters.owner"
        :owners="owners"
        @update:keyword="onKeyword"
        @update:status="onStatus"
        @update:priority="onPriority"
        @update:owner="onOwner"
      />
    </PagePanel>

    <PagePanel title="工单列表">
      <AntTable
        :columns="columns"
        :data-source="rows"
        :pagination="pagination"
        row-key="id"
        :loading="loading"
        @change="onTableChange"
      />

      <AntDivider />
      <AntSpace wrap>
        <AntSelect
          :value="activeTicketId"
          style="width: 320px"
          :options="ticketOptions"
          placeholder="选择要处理的工单"
          @change="onActiveTicketChange"
        />
        <AntButton :disabled="!canClaim" @click="onClaim">接单</AntButton>
        <AntButton danger :disabled="!canEscalate" @click="onEscalate">升级</AntButton>
        <AntButton type="link" :disabled="!activeTicketId" @click="toDetail">详情</AntButton>
      </AntSpace>
    </PagePanel>
  </section>
</template>

<script setup lang="ts">
// @vr-name: TicketsList
import {
  Button as AntButton,
  Divider as AntDivider,
  Select as AntSelect,
  Space as AntSpace,
  Table as AntTable,
  message,
} from 'antd';
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import PagePanel from '../components/PagePanel.vue';
import TicketFilterBar from '../components/TicketFilterBar.vue';
import {
  claimTicket,
  escalateTicket,
  fetchOwners,
  fetchTickets,
  type Ticket,
} from '../data/mock-api';
import { appStore } from '../store/useAppStore';

const router = useRouter();
const rows = ref<Ticket[]>([]);
const owners = ref<string[]>([]);
const loading = ref(false);

const filters = ref(appStore.getState().ticketFilters);
const page = ref(1);
const pageSize = ref(10);
const total = ref(0);
const sortField = ref<'dueAt' | 'priority' | 'createdAt' | undefined>('dueAt');
const sortOrder = ref<'ascend' | 'descend'>('ascend');
const activeTicketId = ref('');

const columns = [
  { title: '工单号', dataIndex: 'id', key: 'id' },
  { title: '标题', dataIndex: 'title', key: 'title' },
  { title: '客户', dataIndex: 'customer', key: 'customer' },
  { title: '负责人', dataIndex: 'owner', key: 'owner' },
  { title: '优先级', dataIndex: 'priority', key: 'priority', sorter: true },
  { title: '状态', dataIndex: 'status', key: 'status' },
  { title: '截止时间', dataIndex: 'dueAt', key: 'dueAt', sorter: true },
  { title: '操作', dataIndex: 'operationHint', key: 'operationHint' },
];

const pagination = ref({
  current: page.value,
  pageSize: pageSize.value,
  total: total.value,
  showSizeChanger: true,
  showQuickJumper: true,
});

const ticketOptions = computed(() =>
  rows.value.map((item) => ({
    value: item.id,
    label: `${item.id} | ${item.title}`,
  })),
);

const activeTicket = computed(
  () => rows.value.find((item) => item.id === activeTicketId.value) || null,
);
const canClaim = computed(() => !!activeTicket.value && activeTicket.value.status !== 'closed');
const canEscalate = computed(() => !!activeTicket.value && activeTicket.value.status !== 'closed');

appStore.subscribe((state) => {
  filters.value = state.ticketFilters;
});

const normalizeRows = (items: Ticket[]) =>
  items.map((item) => ({
    ...item,
    operationHint: item.status === 'closed' ? '已关闭，不可操作' : '可接单 / 可升级',
  }));

const reload = async () => {
  loading.value = true;
  try {
    const data = await fetchTickets({
      ...filters.value,
      page: page.value,
      pageSize: pageSize.value,
      sortField: sortField.value,
      sortOrder: sortOrder.value,
    });

    rows.value = normalizeRows(data.list);
    total.value = data.total;
    pagination.value = {
      ...pagination.value,
      current: data.page,
      pageSize: data.pageSize,
      total: data.total,
    };

    if (!activeTicketId.value && rows.value.length) {
      activeTicketId.value = rows.value[0]!.id;
    }

    if (activeTicketId.value && !rows.value.find((item) => item.id === activeTicketId.value)) {
      activeTicketId.value = rows.value[0]?.id || '';
    }
  } finally {
    loading.value = false;
  }
};

const onKeyword = (value: string) => {
  page.value = 1;
  appStore.getState().setTicketFilters({ keyword: value });
  reload();
};

const onStatus = (value: string) => {
  page.value = 1;
  appStore.getState().setTicketFilters({ status: value as any });
  reload();
};

const onPriority = (value: string) => {
  page.value = 1;
  appStore.getState().setTicketFilters({ priority: value as any });
  reload();
};

const onOwner = (value: string) => {
  page.value = 1;
  appStore.getState().setTicketFilters({ owner: value });
  reload();
};

const onTableChange = (pager: any, _filter: any, sorter: any) => {
  page.value = pager?.current || 1;
  pageSize.value = pager?.pageSize || 10;

  if (!Array.isArray(sorter) && sorter?.field) {
    sortField.value = sorter.field;
    sortOrder.value = sorter.order || 'ascend';
  }

  reload();
};

const onActiveTicketChange = (value: any) => {
  activeTicketId.value = value || '';
};

const onClaim = async () => {
  if (!activeTicket.value) return;
  await claimTicket({ ticketId: activeTicket.value.id });
  message.success(`已接单：${activeTicket.value.id}`);
  reload();
};

const onEscalate = async () => {
  if (!activeTicket.value) return;
  await escalateTicket({
    ticketId: activeTicket.value.id,
    level: 2,
    reason: '业务影响扩大，需要提升响应等级。',
  });
  message.warning(`已升级：${activeTicket.value.id}`);
  reload();
};

const toDetail = () => {
  if (!activeTicketId.value) return;
  router.push(`/tickets/${activeTicketId.value}`);
};

onMounted(async () => {
  owners.value = await fetchOwners();
  await reload();
});
</script>

<style scoped>
.page-grid {
  display: grid;
  gap: 12px;
}
</style>
