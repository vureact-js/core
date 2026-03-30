<template>
  <section class="page-grid">
    <PagePanel title="客户管理">
      <template #extra>
        <AntSpace>
          <AntInput
            :value="keyword"
            placeholder="搜索客户/行业/负责人"
            allow-clear
            @change="onKeyword"
          />
          <AntSelect :value="tier" style="width: 120px" :options="tierOptions" @change="onTier" />
        </AntSpace>
      </template>

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
          :value="detailId"
          style="width: 320px"
          :options="customerOptions"
          placeholder="选择客户查看详情"
          @change="onDetailSelect"
        />
        <AntButton type="primary" :disabled="!detailId" @click="openDetailByButton">查看详情</AntButton>
      </AntSpace>
    </PagePanel>

    <AntDrawer :open="drawerOpen" width="560" title="客户详情" @close="onCloseDrawer">
      <div v-if="hasDetail">
        <AntDescriptions :column="1" size="small" bordered>
          <AntDescriptionsItem label="客户">{{ detailName }}</AntDescriptionsItem>
          <AntDescriptionsItem label="行业">{{ detailIndustry }}</AntDescriptionsItem>
          <AntDescriptionsItem label="负责人">{{ detailOwner }}</AntDescriptionsItem>
          <AntDescriptionsItem label="联系人">{{ detailContact }}</AntDescriptionsItem>
          <AntDescriptionsItem label="电话">{{ detailPhone }}</AntDescriptionsItem>
          <AntDescriptionsItem label="邮箱">{{ detailEmail }}</AntDescriptionsItem>
          <AntDescriptionsItem label="满意度">{{ detailSatisfaction }}</AntDescriptionsItem>
          <AntDescriptionsItem label="活跃工单">{{ detailActiveTickets }}</AntDescriptionsItem>
        </AntDescriptions>

        <AntDivider>客户画像趋势图（近 4 个月）</AntDivider>
        <AntSpace wrap>
          <AntTag color="blue">当前满意度：{{ detailSatisfaction }}</AntTag>
          <AntTag :color="trendDirectionColor">趋势：{{ trendDirectionText }}</AntTag>
          <AntTag color="purple">活跃工单：{{ detailActiveTickets }}</AntTag>
        </AntSpace>

        <div class="trend-wrap">
          <div v-for="point in trendSeries" :key="point.month" class="trend-item">
            <div class="trend-head">
              <span>{{ point.month }}</span>
              <span>{{ point.score }} 分（{{ point.deltaText }}）</span>
            </div>
            <AntProgress :percent="point.score" :stroke-color="point.color" :show-info="false" />
          </div>
        </div>

        <AntDivider>最近工单</AntDivider>
        <AntTable
          :columns="recentColumns"
          :data-source="recentRows"
          row-key="id"
          size="small"
          :pagination="false"
        />

        <AntDivider>客户风险评分卡</AntDivider>
        <AntCard size="small">
          <AntSpace wrap>
            <AntTag :color="riskTagColor">{{ riskLevelText }}</AntTag>
            <AntTag color="blue">风险分：{{ riskScore }}</AntTag>
          </AntSpace>

          <div class="risk-wrap">
            <div v-for="factor in riskFactors" :key="factor.label" class="risk-item">
              <div class="risk-head">
                <span>{{ factor.label }}</span>
                <span>{{ factor.value }}</span>
              </div>
              <AntProgress :percent="factor.value" :show-info="false" />
            </div>
          </div>
        </AntCard>

        <AntDivider>快速新建工单</AntDivider>
        <AntForm layout="vertical">
          <AntFormItem label="标题">
            <AntInput :value="draft.title" @change="onDraftTitle" />
          </AntFormItem>
          <AntFormItem label="分类">
            <AntInput :value="draft.category" @change="onDraftCategory" />
          </AntFormItem>
          <AntFormItem label="优先级">
            <AntSelect :value="draft.priority" :options="priorityOptions" @change="onDraftPriority" />
          </AntFormItem>
          <AntFormItem label="摘要">
            <AntInput :value="draft.summary" @change="onDraftSummary" />
          </AntFormItem>
          <AntButton type="primary" @click="createTicket">提交工单</AntButton>
        </AntForm>
      </div>
    </AntDrawer>
  </section>
</template>

<script setup lang="ts">
// @vr-name: CustomersPage
import {
  Button as AntButton,
  Card as AntCard,
  Descriptions as AntDescriptions,
  Divider as AntDivider,
  Drawer as AntDrawer,
  Form as AntForm,
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
  createTicketFromCustomer,
  fetchCustomerDetail,
  fetchCustomerRiskScore,
  fetchCustomers,
} from '../data/mock-api';

const AntDescriptionsItem = (AntDescriptions as any).Item;
const AntFormItem = (AntForm as any).Item;

const rows = ref<any[]>([]);
const loading = ref(false);
const keyword = ref('');
const tier = ref('all');
const page = ref(1);
const pageSize = ref(10);
const total = ref(0);

const drawerOpen = ref(false);
const hasDetail = ref(false);
const detailId = ref('');

const detailName = ref('');
const detailIndustry = ref('');
const detailOwner = ref('');
const detailContact = ref('');
const detailPhone = ref('');
const detailEmail = ref('');
const detailSatisfaction = ref(0);
const detailActiveTickets = ref(0);
const satisfactionHistory = ref<Array<{ month: string; score: number }>>([]);
const recentTickets = ref<Array<{ id: string; title: string; status: string; dueAt: string }>>([]);
const riskScore = ref(0);
const riskLevel = ref<'low' | 'medium' | 'high'>('low');
const riskFactors = ref<Array<{ label: string; value: number }>>([]);

const draft = ref({ title: '', category: '系统支持', priority: 'medium', summary: '' });

const columns = [
  { title: '客户', dataIndex: 'name', key: 'name' },
  { title: '行业', dataIndex: 'industry', key: 'industry' },
  { title: '分层', dataIndex: 'tier', key: 'tier' },
  { title: '负责人', dataIndex: 'owner', key: 'owner' },
  { title: '满意度', dataIndex: 'satisfaction', key: 'satisfaction' },
  { title: '活跃工单', dataIndex: 'activeTicketCount', key: 'activeTicketCount' },
  { title: '操作', dataIndex: 'operationHint', key: 'operationHint' },
];

const recentColumns = [
  { title: '工单号', dataIndex: 'id', key: 'id' },
  { title: '标题', dataIndex: 'title', key: 'title' },
  { title: '状态', dataIndex: 'status', key: 'status' },
  { title: '截止时间', dataIndex: 'dueAt', key: 'dueAt' },
];

const tierOptions = [
  { label: '全部分层', value: 'all' },
  { label: 'A', value: 'A' },
  { label: 'B', value: 'B' },
  { label: 'C', value: 'C' },
];

const priorityOptions = [
  { label: '高', value: 'high' },
  { label: '中', value: 'medium' },
  { label: '低', value: 'low' },
];

const pagination = ref({
  current: page.value,
  pageSize: pageSize.value,
  total: total.value,
  showSizeChanger: true,
});

const customerOptions = computed(() =>
  rows.value.map((item) => ({
    value: item.id,
    label: `${item.id} | ${item.name}`,
  })),
);

const trendSeries = computed(() => {
  return satisfactionHistory.value.map((item, index) => {
    const prev = index > 0 ? satisfactionHistory.value[index - 1]?.score || item.score : item.score;
    const delta = item.score - prev;
    return {
      month: item.month,
      score: item.score,
      delta,
      deltaText: delta > 0 ? `+${delta}` : `${delta}`,
      color: delta >= 0 ? '#1677ff' : '#ff4d4f',
    };
  });
});

const trendDirectionText = computed(() => {
  if (trendSeries.value.length < 2) return '持平';
  const first = trendSeries.value[0]?.score || 0;
  const last = trendSeries.value[trendSeries.value.length - 1]?.score || 0;
  if (last > first) return '上升';
  if (last < first) return '下降';
  return '持平';
});

const trendDirectionColor = computed(() => {
  if (trendDirectionText.value === '上升') return 'success';
  if (trendDirectionText.value === '下降') return 'error';
  return 'default';
});

const riskLevelText = computed(() => {
  if (riskLevel.value === 'high') return '高风险';
  if (riskLevel.value === 'medium') return '中风险';
  return '低风险';
});

const riskTagColor = computed(() => {
  if (riskLevel.value === 'high') return 'error';
  if (riskLevel.value === 'medium') return 'warning';
  return 'success';
});

const recentRows = computed(() => recentTickets.value);

const reload = async () => {
  loading.value = true;
  try {
    const data = await fetchCustomers({
      keyword: keyword.value,
      tier: tier.value as any,
      page: page.value,
      pageSize: pageSize.value,
    });

    rows.value = data.list.map((item) => ({ ...item, operationHint: '可查看详情 / 可发起工单' }));
    total.value = data.total;
    pagination.value = {
      ...pagination.value,
      current: data.page,
      pageSize: data.pageSize,
      total: data.total,
    };

    if (!detailId.value && rows.value.length) {
      detailId.value = rows.value[0]!.id;
    }

    if (detailId.value && !rows.value.find((item) => item.id === detailId.value)) {
      detailId.value = rows.value[0]?.id || '';
    }
  } finally {
    loading.value = false;
  }
};

const onKeyword = (event: any) => {
  keyword.value = event?.target?.value || '';
  page.value = 1;
  reload();
};

const onTier = (value: any) => {
  tier.value = value || 'all';
  page.value = 1;
  reload();
};

const onTableChange = (pager: any) => {
  page.value = pager?.current || 1;
  pageSize.value = pager?.pageSize || 10;
  reload();
};

const onDetailSelect = (value: any) => {
  detailId.value = value || '';
};

const openDetailByButton = async () => {
  if (!detailId.value) return;
  const value = await fetchCustomerDetail(detailId.value);

  detailName.value = value.name;
  detailIndustry.value = value.industry;
  detailOwner.value = value.owner;
  detailContact.value = value.contact;
  detailPhone.value = value.phone;
  detailEmail.value = value.email;
  detailSatisfaction.value = value.satisfaction;
  detailActiveTickets.value = value.activeTickets;
  satisfactionHistory.value = value.satisfactionHistory || [];
  recentTickets.value = (value.recentTickets || []).map((item: any) => ({
    id: item.id,
    title: item.title,
    status: item.status,
    dueAt: item.dueAt,
  }));

  const risk = await fetchCustomerRiskScore(detailId.value);
  riskScore.value = risk.score;
  riskLevel.value = risk.level;
  riskFactors.value = risk.factors || [];

  hasDetail.value = true;
  drawerOpen.value = true;
  draft.value = {
    title: `${detailName.value} 问题跟进`,
    category: '系统支持',
    priority: 'medium',
    summary: '',
  };
};

const onDraftTitle = (event: any) => {
  draft.value.title = event?.target?.value || '';
};

const onDraftCategory = (event: any) => {
  draft.value.category = event?.target?.value || '';
};

const onDraftSummary = (event: any) => {
  draft.value.summary = event?.target?.value || '';
};

const onDraftPriority = (value: any) => {
  draft.value.priority = value || 'medium';
};

const createTicket = async () => {
  if (!detailId.value) return;
  if (!draft.value.title.trim()) {
    message.error('请填写工单标题');
    return;
  }

  const ticket = await createTicketFromCustomer({
    customerId: detailId.value,
    title: draft.value.title,
    category: draft.value.category,
    priority: draft.value.priority as any,
    summary: draft.value.summary,
  });

  message.success(`工单已创建：${ticket.id}`);
  await reload();
};

const onCloseDrawer = () => {
  drawerOpen.value = false;
};

onMounted(reload);
</script>

<style scoped>
.page-grid {
  display: grid;
  gap: 12px;
}

.trend-wrap {
  display: grid;
  gap: 8px;
  margin-top: 12px;
}

.trend-item {
  border: 1px solid #eef2f8;
  border-radius: 8px;
  padding: 8px 10px;
}

.trend-head {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #4a5568;
  margin-bottom: 6px;
}

.risk-wrap {
  display: grid;
  gap: 8px;
  margin-top: 12px;
}

.risk-item {
  border: 1px solid #eef2f8;
  border-radius: 8px;
  padding: 8px 10px;
}

.risk-head {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #4a5568;
  margin-bottom: 6px;
}
</style>
