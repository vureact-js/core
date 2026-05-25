<template>
  <section class="page-grid">
    <PagePanel title="多渠道会话过滤">
      <AntForm layout="inline" class-name="filter-form">
        <AntFormItem label="来源渠道">
          <AntSelect :value="filters.channel" style="width: 140px" :options="channelOptions" @change="onChannelChange" />
        </AntFormItem>
        <AntFormItem label="服务队列">
          <AntSelect :value="filters.queue" style="width: 150px" :options="queueOptions" @change="onQueueChange" />
        </AntFormItem>
        <AntFormItem label="状态">
          <AntSelect :value="filters.status" style="width: 150px" :options="statusOptions" @change="onStatusChange" />
        </AntFormItem>
        <AntFormItem label="关键词">
          <AntInput
            :value="filters.keyword"
            allow-clear
            placeholder="客户 / 摘要 / 会话号"
            @change="onKeywordChange"
          />
        </AntFormItem>
      </AntForm>
    </PagePanel>

    <AntRow :gutter="[12, 12]">
      <AntCol :xs="24" :xl="11">
        <ConversationPanel
          ref="panelRef"
          title="会话队列"
          :groups="groupPanels"
          :active-id="activeConversationId"
          v-model:selectedIds="selectedIds"
          @select="onConversationSelect"
        >
          <template #header="{ total, queue }">
            <AntSpace wrap>
              <AntTag color="blue">共 {{ total }} 条</AntTag>
              <AntTag color="purple">{{ queue }}</AntTag>
            </AntSpace>
          </template>

          <template #actions="{ selectedCount, hasSelection, clearSelection }">
            <AntSpace wrap>
              <AntSelect
                :value="batchAgentId"
                style="width: 160px"
                :options="agentOptions"
                placeholder="批量转派到"
                @change="onBatchAgentChange"
              />
              <AntButton type="primary" :disabled="!hasSelection || !batchAgentId" @click="onBatchAssign">
                批量转派 {{ selectedCount || '' }}
              </AntButton>
              <AntButton :disabled="!hasSelection" @click="clearSelection">清空选择</AntButton>
            </AntSpace>
          </template>

          <template #default="{ item, selected, activate, toggle }">
            <div class="custom-card-body">
              <div class="body-top">
                <div>
                  <p class="subject">{{ item.customerName }}</p>
                  <p class="subtext">{{ item.latestMessage }}</p>
                </div>
                <AntButton type="link" @click.stop="activate()">查看</AntButton>
              </div>

              <AntSpace wrap>
                <AntTag :color="item.priority === 'high' ? 'red' : item.priority === 'medium' ? 'gold' : 'blue'">
                  {{ item.priority }}
                </AntTag>
                <AntTag v-if="item.linkedTicketId" color="green">{{ item.linkedTicketId }}</AntTag>
                <AntTag v-for="tag in item.tags.slice(0, 2)" :key="tag">{{ tag }}</AntTag>
              </AntSpace>

              <div class="body-bottom">
                <span>{{ selected ? '已加入批量操作' : '可加入批量操作' }}</span>
                <AntButton type="link" @click.stop="toggle()">
                  {{ selected ? '取消' : '选择' }}
                </AntButton>
              </div>
            </div>
          </template>

          <template #empty="{ group }">
            <EmptyState :text="`${group.title} 暂无命中会话`" />
          </template>
        </ConversationPanel>
      </AntCol>

      <AntCol :xs="24" :xl="13">
        <PagePanel title="会话预览与动作">
          <ConversationPreview :detail="detail" :loading="detailLoading">
            <template #header="{ detail: currentDetail, refresh }">
              <div class="preview-top">
                <div>
                  <h3>{{ currentDetail.subject }}</h3>
                  <p class="preview-summary">{{ currentDetail.summary }}</p>
                </div>
                <AntSpace wrap>
                  <AntButton type="default" @click="refresh">刷新</AntButton>
                  <AntButton v-if="currentDetail.linkedTicketId" type="link" @click="toTicket(currentDetail.linkedTicketId)">
                    打开工单
                  </AntButton>
                </AntSpace>
              </div>
            </template>

            <template #actions="{ detail: currentDetail, linkedTicket, suggestedAgents }">
              <AntRow :gutter="[12, 12]">
                <AntCol :xs="24" :md="12">
                  <AntCard size="small" title="工单动作">
                    <AntForm layout="vertical" class-name="action-form">
                      <AntFormItem label="工单标题">
                        <AntInput :value="convertTitle" @change="onConvertTitleChange" />
                      </AntFormItem>
                      <AntFormItem label="工单优先级">
                        <AntSelect :value="convertPriority" :options="priorityOptions" @change="onConvertPriorityChange" />
                      </AntFormItem>
                      <AntFormItem label="并入已有工单">
                        <AntSelect
                          :value="mergeTicketId"
                          allow-clear
                          show-search
                          :options="ticketOptions"
                          placeholder="选择已有工单"
                          @change="onMergeTicketChange"
                        />
                      </AntFormItem>

                      <AntSpace wrap>
                        <AntButton
                          type="primary"
                          :disabled="!convertTitle || !!linkedTicket"
                          @click="onConvertConversation"
                        >
                          转工单
                        </AntButton>
                        <AntButton :disabled="!mergeTicketId" @click="onMergeConversation">并单</AntButton>
                        <AntButton danger @click="onHighPriority">标记高优先</AntButton>
                      </AntSpace>
                    </AntForm>
                  </AntCard>
                </AntCol>

                <AntCol :xs="24" :md="12">
                  <AntCard size="small" title="协同动作">
                    <AntForm layout="vertical" class-name="action-form">
                      <AntFormItem label="转派坐席">
                        <AntSelect
                          :value="assignAgentId"
                          :options="agentOptions"
                          placeholder="选择坐席"
                          @change="onAssignAgentChange"
                        />
                      </AntFormItem>
                      <AntFormItem label="挂起原因">
                        <AntInputTextArea :value="pendingReason" :rows="3" @change="onPendingReasonChange" />
                      </AntFormItem>
                      <AntFormItem label="回复草稿">
                        <AntInputTextArea :value="draftReplyContent" :rows="3" @change="onDraftReplyChange" />
                      </AntFormItem>
                      <AntFormItem label="草稿标记">
                        <AntCheckboxGroup :value="actionFlags" :options="flagOptions" @change="onFlagChange" />
                      </AntFormItem>

                      <AntSpace wrap>
                        <AntButton type="primary" :disabled="!assignAgentId" @click="onAssignCurrent">转派</AntButton>
                        <AntButton :disabled="!pendingReason" @click="onPendingCurrent">挂起</AntButton>
                        <AntButton @click="onSaveDraft">保存草稿</AntButton>
                      </AntSpace>

                      <div v-if="currentDetail.suggestedAgents.length" class="assist-text">
                        推荐坐席：{{ currentDetail.suggestedAgents.map((item) => item.name).join(' / ') }}
                      </div>
                      <div v-else-if="suggestedAgents.length" class="assist-text">
                        推荐坐席：{{ suggestedAgents.map((item) => item.name).join(' / ') }}
                      </div>
                      <div v-else class="assist-text">
                        当前渠道暂无技能匹配推荐，请按班组手动分配。
                      </div>
                    </AntForm>
                  </AntCard>
                </AntCol>
              </AntRow>
            </template>
          </ConversationPreview>
        </PagePanel>
      </AntCol>
    </AntRow>
  </section>
</template>

<script setup lang="ts">
// @vr-name: ConversationCenter
import {
  Button as AntButton,
  Card as AntCard,
  Checkbox as AntCheckbox,
  Col as AntCol,
  Form as AntForm,
  Input as AntInput,
  Row as AntRow,
  Select as AntSelect,
  Space as AntSpace,
  Tag as AntTag,
  message,
} from 'antd';
import { computed, onMounted, provide, ref, watch, watchEffect } from 'vue';
import { useRouter } from 'vue-router';
import ConversationPanel from '../components/ConversationPanel.vue';
import ConversationPreview from '../components/ConversationPreview.vue';
import EmptyState from '../components/EmptyState.vue';
import PagePanel from '../components/PagePanel.vue';
import {
  activeConversationContextKey,
  batchActionContextKey,
} from '../components/conversation-context';
import {
  assignConversations,
  convertConversationToTicket,
  fetchAgents,
  fetchConversationDetail,
  fetchConversations,
  fetchTicketOptions,
  markConversationPending,
  mergeConversationToTicket,
  saveConversationDraft,
  setConversationPriority,
  type Agent,
  type Conversation,
  type ConversationDetail,
  type ConversationQueue,
  type ConversationStatus,
  type Ticket,
} from '../data/mock-api';

const AntFormItem = (AntForm as any).Item;
const AntInputTextArea = AntInput.TextArea;
const AntCheckboxGroup = AntCheckbox.Group;

const router = useRouter();
const panelRef = ref<any>(null);
const filters = ref<{
  channel: 'all' | 'chat' | 'email' | 'phone' | 'social';
  queue: 'all' | ConversationQueue;
  status: 'all' | ConversationStatus;
  keyword: string;
}>({
  channel: 'all',
  queue: 'all',
  status: 'all',
  keyword: '',
});

const conversations = ref<Conversation[]>([]);
const groups = ref<Record<'unassigned' | 'processing' | 'pending' | 'escalated', Conversation[]>>({
  unassigned: [],
  processing: [],
  pending: [],
  escalated: [],
});
const activeConversationId = ref('');
const selectedIds = ref<string[]>([]);
const detail = ref<ConversationDetail | null>(null);
const detailLoading = ref(false);
const agents = ref<Agent[]>([]);
const ticketOptions = ref<Array<{ value: string; label: string }>>([]);
const batchAgentId = ref('');
const assignAgentId = ref('');
const mergeTicketId = ref('');
const convertTitle = ref('');
const convertPriority = ref<Ticket['priority']>('high');
const pendingReason = ref('');
const draftReplyContent = ref('');
const actionFlags = ref<string[]>([]);

const channelOptions = [
  { label: '全部', value: 'all' },
  { label: '在线聊天', value: 'chat' },
  { label: '邮件', value: 'email' },
  { label: '电话回呼', value: 'phone' },
  { label: '社媒私信', value: 'social' },
];

const queueOptions = [
  { label: '全部', value: 'all' },
  { label: 'VIP', value: 'vip' },
  { label: '账单', value: 'billing' },
  { label: '集成', value: 'integration' },
  { label: '留存', value: 'retention' },
];

const statusOptions = [
  { label: '全部', value: 'all' },
  { label: '待分配', value: 'unassigned' },
  { label: '处理中', value: 'processing' },
  { label: '待客户回复', value: 'pending' },
  { label: '待升级', value: 'escalated' },
];

const priorityOptions = [
  { label: '高', value: 'high' },
  { label: '中', value: 'medium' },
  { label: '低', value: 'low' },
];

const flagOptions = [
  { label: '仅内部草稿', value: 'internal' },
  { label: '需主管确认', value: 'supervisor' },
  { label: '已同步客户', value: 'customer' },
];

const agentOptions = computed(() =>
  agents.value.map((item) => ({
    label: `${item.name} · ${item.team}`,
    value: item.id,
  })),
);

const providedQueue = computed(() => filters.value.queue);
const providedStatus = computed(() => filters.value.status);

const groupPanels = computed(() => [
  { key: 'unassigned', title: '待分配', items: groups.value.unassigned },
  { key: 'processing', title: '处理中', items: groups.value.processing },
  { key: 'pending', title: '待客户回复', items: groups.value.pending },
  { key: 'escalated', title: '待升级', items: groups.value.escalated },
]);

provide(batchActionContextKey, {
  selectedIds,
  queue: providedQueue,
  status: providedStatus,
  agents,
  setSelectedIds: (ids: string[]) => {
    selectedIds.value = ids;
  },
});

provide(activeConversationContextKey, {
  activeId: activeConversationId,
  activeDetail: detail,
  refresh: async () => {
    await loadDetail();
  },
});

const loadConversations = async () => {
  const result = await fetchConversations(filters.value);
  conversations.value = result.list;
  groups.value = result.groups;

  if (!activeConversationId.value || !result.list.find((item) => item.id === activeConversationId.value)) {
    activeConversationId.value = result.list[0]?.id || '';
  }

  if (!selectedIds.value.every((id) => result.list.some((item) => item.id === id))) {
    selectedIds.value = selectedIds.value.filter((id) => result.list.some((item) => item.id === id));
  }
};

const loadDetail = async () => {
  if (!activeConversationId.value) {
    detail.value = null;
    return;
  }

  detailLoading.value = true;
  try {
    detail.value = await fetchConversationDetail(activeConversationId.value);
  } finally {
    detailLoading.value = false;
  }
};

const refreshAll = async () => {
  await loadConversations();
  await loadDetail();
};

watch(
  filters,
  async () => {
    await loadConversations();
    await loadDetail();
  },
  { deep: true },
);

watch(
  () => activeConversationId.value,
  async () => {
    await loadDetail();
  },
);

watch(
  () => detail.value?.id,
  () => {
    resetActionDrafts();
  },
);

watchEffect(() => {
  if (!detail.value) return;

  if (!convertTitle.value) {
    convertTitle.value = detail.value.subject;
  }
  if (!assignAgentId.value && detail.value.ownerId) {
    assignAgentId.value = detail.value.ownerId;
  }
  if (!mergeTicketId.value && detail.value.linkedTicketId) {
    mergeTicketId.value = detail.value.linkedTicketId;
  }
  if (!pendingReason.value && detail.value.waitingReason) {
    pendingReason.value = detail.value.waitingReason;
  }
  if (!draftReplyContent.value && detail.value.draftReply?.content) {
    draftReplyContent.value = detail.value.draftReply.content;
  }
});

const resetActionDrafts = () => {
  mergeTicketId.value = detail.value?.linkedTicketId || '';
  convertTitle.value = detail.value?.subject || '';
  convertPriority.value = detail.value?.priority || 'high';
  pendingReason.value = detail.value?.waitingReason || '';
  draftReplyContent.value = detail.value?.draftReply?.content || '';
  assignAgentId.value = detail.value?.ownerId || '';
  actionFlags.value = detail.value?.draftReply?.internalOnly ? ['internal'] : [];
};

const onConversationSelect = (id: string) => {
  activeConversationId.value = id;
};

const onChannelChange = (value: any) => {
  filters.value.channel = value || 'all';
};

const onQueueChange = (value: any) => {
  filters.value.queue = value || 'all';
};

const onStatusChange = (value: any) => {
  filters.value.status = value || 'all';
};

const onKeywordChange = (event: any) => {
  filters.value.keyword = event?.target?.value || '';
};

const onBatchAgentChange = (value: any) => {
  batchAgentId.value = value || '';
};

const onAssignAgentChange = (value: any) => {
  assignAgentId.value = value || '';
};

const onMergeTicketChange = (value: any) => {
  mergeTicketId.value = value || '';
};

const onConvertTitleChange = (event: any) => {
  convertTitle.value = event?.target?.value || '';
};

const onConvertPriorityChange = (value: any) => {
  convertPriority.value = value || 'high';
};

const onPendingReasonChange = (event: any) => {
  pendingReason.value = event?.target?.value || '';
};

const onDraftReplyChange = (event: any) => {
  draftReplyContent.value = event?.target?.value || '';
};

const onFlagChange = (value: any) => {
  actionFlags.value = Array.isArray(value) ? value : [];
};

const onBatchAssign = async () => {
  if (!selectedIds.value.length || !batchAgentId.value) return;
  await assignConversations({ ids: selectedIds.value, agentId: batchAgentId.value });
  message.success(`已批量转派 ${selectedIds.value.length} 条会话`);
  selectedIds.value = [];
  await refreshAll();
};

const onAssignCurrent = async () => {
  if (!detail.value || !assignAgentId.value) return;
  await assignConversations({ ids: [detail.value.id], agentId: assignAgentId.value });
  message.success(`会话 ${detail.value.id} 已转派`);
  await refreshAll();
};

const onPendingCurrent = async () => {
  if (!detail.value || !pendingReason.value.trim()) return;
  await markConversationPending({ id: detail.value.id, reason: pendingReason.value });
  message.warning(`会话 ${detail.value.id} 已挂起`);
  await refreshAll();
};

const onHighPriority = async () => {
  if (!detail.value) return;
  await setConversationPriority({
    id: detail.value.id,
    priority: 'high',
    reason: '影响客户业务连续性，需要主管介入。',
  });
  message.error(`会话 ${detail.value.id} 已标记为高优先`);
  await refreshAll();
};

const onSaveDraft = async () => {
  if (!detail.value) return;
  await saveConversationDraft({
    conversationId: detail.value.id,
    content: draftReplyContent.value,
    pendingReason: pendingReason.value,
    mentions: actionFlags.value,
    internalOnly: actionFlags.value.includes('internal'),
  });
  message.success('草稿已保存');
  await loadDetail();
};

const onConvertConversation = async () => {
  if (!detail.value || !convertTitle.value.trim()) return;
  const ticket = await convertConversationToTicket({
    conversationId: detail.value.id,
    title: convertTitle.value,
    priority: convertPriority.value,
  });
  message.success(`已创建工单 ${ticket.id}`);
  await refreshAll();
};

const onMergeConversation = async () => {
  if (!detail.value || !mergeTicketId.value) return;
  await mergeConversationToTicket({
    conversationId: detail.value.id,
    ticketId: mergeTicketId.value,
  });
  message.success(`已并入工单 ${mergeTicketId.value}`);
  await refreshAll();
};

const toTicket = (ticketId: string) => {
  router.push(`/tickets/${ticketId}`);
};

onMounted(async () => {
  agents.value = await fetchAgents();
  ticketOptions.value = await fetchTicketOptions();
  await loadConversations();
  await loadDetail();
  panelRef.value?.selectFirstAvailable?.();
});
</script>

<style scoped>
.page-grid {
  display: grid;
  gap: 12px;
}

.filter-form {
  row-gap: 10px;
}

.custom-card-body {
  display: grid;
  gap: 10px;
}

.body-top,
.body-bottom,
.preview-top {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: start;
}

.subject {
  margin: 0;
  color: #111827;
  font-weight: 600;
}

.subtext,
.preview-summary,
.assist-text {
  margin: 4px 0 0;
  color: #6b7280;
  line-height: 1.6;
}

.body-bottom {
  align-items: center;
}

.preview-top h3 {
  margin: 0;
  color: #111827;
}

.action-form {
  display: grid;
}
</style>
