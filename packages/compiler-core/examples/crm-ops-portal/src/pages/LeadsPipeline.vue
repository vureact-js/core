<template>
  <section class="page-section">
    <header class="page-header">
      <div>
        <h2>线索管道</h2>
        <p class="muted">按阶段推进线索，跟踪金额、概率与停留时长。</p>
      </div>
      <div class="header-actions">
        <div class="summary">总额 {{ pipelineValue }} · 高风险 {{ hotCount }} 条</div>
        <button class="primary" @click="createQuickLead">新增线索</button>
        <button class="ghost" @click="reset">重置阶段</button>
      </div>
    </header>

    <div class="filters">
      <input v-model="keyword" class="input" placeholder="搜索线索/负责人" />
      <select v-model="ownerFilter" class="select">
        <option value="all">全部负责人</option>
        <option v-for="owner in owners" :key="owner" :value="owner">{{ owner }}</option>
      </select>
      <select v-model="sourceFilter" class="select">
        <option value="all">全部来源</option>
        <option v-for="source in sources" :key="source" :value="source">{{ source }}</option>
      </select>
      <input v-model="quickLeadName" class="input" placeholder="快速新建线索名称" />
    </div>

    <div v-if="actionNotice" class="notice">{{ actionNotice }}</div>

    <div class="pipeline">
      <PipelineStage
        v-for="stage in stages"
        :key="stage.key"
        :stage="{ ...stage, items: getItems(stage.key) }"
        @move="onMove"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
// @vr-name: LeadsPipeline
import { computed, onMounted, ref } from 'vue';
import PipelineStage from '../components/PipelineStage.vue';
import {
  createLead,
  fetchLeads,
  fetchStages,
  moveLead,
  resetLeads,
  triggerLeadApprovalByThreshold,
} from '../data/mock-api';

type Lead = Awaited<ReturnType<typeof fetchLeads>>[0];

const leads = ref<Lead[]>([]);
const stages = ref<Awaited<ReturnType<typeof fetchStages>>>([]);

const keyword = ref('');
const ownerFilter = ref('all');
const sourceFilter = ref('all');
const quickLeadName = ref('');
const actionNotice = ref('');

const owners = computed(() => Array.from(new Set(leads.value.map((lead) => lead.owner))));
const sources = computed(() => Array.from(new Set(leads.value.map((lead) => lead.source))));

const filteredLeads = computed(() => {
  return leads.value.filter((lead) => {
    const hitKeyword = lead.name.includes(keyword.value) || lead.owner.includes(keyword.value);
    const hitOwner = ownerFilter.value === 'all' || lead.owner === ownerFilter.value;
    const hitSource = sourceFilter.value === 'all' || lead.source === sourceFilter.value;
    return hitKeyword && hitOwner && hitSource;
  });
});

function getItems(stageKey: string) {
  return filteredLeads.value.filter((lead) => lead.stage === stageKey);
}

const pipelineValue = computed(() => {
  const sum = filteredLeads.value.reduce((acc, item) => acc + item.value, 0);
  return `¥ ${sum} 万`;
});

const hotCount = computed(() => filteredLeads.value.filter((item) => item.daysInStage > 5).length);

const onMove = async (payload: { id: string; stage: string; direction: 'next' | 'prev' }) => {
  const updated = await moveLead(payload.id, payload.direction);
  leads.value = leads.value.map((lead) => (lead.id === updated.id ? updated : lead));
  const result = await triggerLeadApprovalByThreshold(updated.id);
  if (result.triggered) {
    actionNotice.value = `线索「${updated.name}」已触发高价值审批。`;
    setTimeout(() => {
      actionNotice.value = '';
    }, 2200);
  }
};

const reset = async () => {
  leads.value = await resetLeads();
};

const createQuickLead = async () => {
  const name = quickLeadName.value.trim();
  if (!name) {
    actionNotice.value = '请输入线索名称后再创建。';
    setTimeout(() => {
      actionNotice.value = '';
    }, 2000);
    return;
  }
  const created = await createLead({
    name,
    owner: ownerFilter.value === 'all' ? '张琳' : ownerFilter.value,
  });
  leads.value.unshift(created);
  const result = await triggerLeadApprovalByThreshold(created.id);
  quickLeadName.value = '';
  actionNotice.value = result.triggered
    ? `已新增线索：${created.name}，并触发审批流程。`
    : `已新增线索：${created.name}`;
  setTimeout(() => {
    actionNotice.value = '';
  }, 2000);
};

onMounted(async () => {
  leads.value = await fetchLeads();
  stages.value = await fetchStages();
});
</script>

<style scoped>
.page-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.summary {
  font-size: 12px;
  color: var(--muted);
}

.filters {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
}

.notice {
  padding: 10px 12px;
  border-radius: 10px;
  background: var(--banner);
  font-size: 12px;
}

.input,
.select {
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid var(--border);
}

.pipeline {
  display: grid;
  grid-auto-columns: minmax(260px, 1fr);
  gap: 12px;
  padding-bottom: 8px;
}

.primary {
  background: var(--accent);
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 8px 14px;
}

.ghost {
  border: 1px solid var(--border);
  padding: 8px 14px;
  border-radius: 8px;
  color: #ccc;
}

.muted {
  color: var(--muted);
}

@media (max-width: 960px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
