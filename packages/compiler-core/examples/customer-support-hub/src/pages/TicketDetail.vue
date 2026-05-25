<template>
  <section class="page-grid" v-if="ticket">
    <PagePanel :title="`${ticket.id} - ${ticket.title}`">
      <template #extra>
        <TicketStatusTag :status="ticket.status" />
      </template>

      <AntDescriptions :column="2" bordered size="small">
        <AntDescriptionsItem label="客户">{{ ticket.customer }}</AntDescriptionsItem>
        <AntDescriptionsItem label="负责人">{{ ticket.owner }}</AntDescriptionsItem>
        <AntDescriptionsItem label="优先级">{{ ticket.priority }}</AntDescriptionsItem>
        <AntDescriptionsItem label="分类">{{ ticket.category }}</AntDescriptionsItem>
        <AntDescriptionsItem label="创建时间">{{ ticket.createdAt }}</AntDescriptionsItem>
        <AntDescriptionsItem label="截止时间">{{ ticket.dueAt }}</AntDescriptionsItem>
      </AntDescriptions>

      <AntAlert style="margin-top: 12px" type="info" :message="ticket.summary" show-icon />

      <AntSpace style="margin-top: 12px" wrap>
        <AntPopconfirm title="确认设为待处理？" @confirm="toOpen">
          <AntButton>设为待处理</AntButton>
        </AntPopconfirm>

        <AntPopconfirm title="确认设为处理中？" @confirm="toProcessing">
          <AntButton>设为处理中</AntButton>
        </AntPopconfirm>

        <AntPopconfirm title="确认标记已解决？" @confirm="toResolved">
          <AntButton type="primary">标记已解决</AntButton>
        </AntPopconfirm>

        <AntPopconfirm title="确认关闭工单？" @confirm="toClosed">
          <AntButton danger>关闭工单</AntButton>
        </AntPopconfirm>
      </AntSpace>
    </PagePanel>

    <PagePanel title="处理耗时与 SLA 计时">
      <AntRow :gutter="[12, 12]">
        <AntCol :xs="24" :md="8">
          <AntStatistic title="累计耗时" :value="spentText" />
        </AntCol>
        <AntCol :xs="24" :md="8">
          <AntStatistic title="剩余时长" :value="remainText" />
        </AntCol>
        <AntCol :xs="24" :md="8">
          <AntStatistic title="超时分钟" :value="slaSnapshot.overdueMinutes" />
        </AntCol>
      </AntRow>

      <AntProgress
        :percent="slaSnapshot.progressPercent"
        :status="slaProgressStatus"
        :stroke-color="slaProgressColor"
      />

      <AntSpace>
        <AntTag color="blue">总时长：{{ formatMinutes(slaSnapshot.totalMinutes) }}</AntTag>
        <AntTag :color="slaRiskTagColor">{{ slaRiskText }}</AntTag>
      </AntSpace>
    </PagePanel>

    <AntRow :gutter="[12, 12]">
      <AntCol :xs="24" :xl="11">
        <PagePanel title="关联会话列表">
          <template #extra>
            <RouterLink to="/conversations">查看全部会话</RouterLink>
          </template>

          <AntTable
            :columns="conversationColumns"
            :data-source="linkedConversations"
            :pagination="false"
            row-key="id"
            size="small"
          />
          <EmptyState v-if="!linkedConversations.length" text="当前工单还没有关联会话" />
        </PagePanel>
      </AntCol>

      <AntCol :xs="24" :xl="13">
        <PagePanel title="升级记录">
          <div class="record-list">
            <article v-for="item in escalationRecords" :key="item.id" class="record-item">
              <strong>{{ item.createdAt }} · L{{ item.level }} · {{ item.owner }}</strong>
              <p>{{ item.reason }}{{ item.conversationId ? ` · 来源会话 ${item.conversationId}` : '' }}</p>
            </article>
          </div>
          <EmptyState v-if="!escalationRecords.length" text="暂无升级记录" />
        </PagePanel>
      </AntCol>
    </AntRow>

    <AntRow :gutter="[12, 12]">
      <AntCol :xs="24" :xl="12">
        <PagePanel title="内部协同备注">
          <InternalNoteComposer
            ref="noteComposerRef"
            v-model="noteDraft"
            v-model:noteType="noteType"
            v-model:mentions="noteMentions"
            @save-draft="onSaveDraft"
            @submit="onSubmitNote"
          />
        </PagePanel>
      </AntCol>

      <AntCol :xs="24" :xl="12">
        <PagePanel title="备注流">
          <div class="record-list">
            <article v-for="item in internalNotes" :key="item.id" class="record-item">
              <div class="record-head">
                <strong>{{ item.author }} · {{ item.createdAt }}</strong>
                <AntTag :color="item.type === 'risk' ? 'red' : item.type === 'follow-up' ? 'gold' : 'blue'">
                  {{ item.type }}
                </AntTag>
              </div>
              <p>{{ item.content }}{{ item.mentions.length ? ` · @${item.mentions.join(' / ')}` : '' }}</p>
            </article>
          </div>
          <EmptyState v-if="!internalNotes.length" text="暂无内部备注" />
        </PagePanel>
      </AntCol>
    </AntRow>

    <PagePanel title="处理时间轴">
      <AntTimeline :items="timelineItems" />
    </PagePanel>
  </section>
</template>

<script setup lang="ts">
// @vr-name: TicketDetail
import {
  Alert as AntAlert,
  Button as AntButton,
  Col as AntCol,
  Descriptions as AntDescriptions,
  Popconfirm as AntPopconfirm,
  Progress as AntProgress,
  Row as AntRow,
  Space as AntSpace,
  Statistic as AntStatistic,
  Table as AntTable,
  Tag as AntTag,
  Timeline as AntTimeline,
  message,
} from 'antd';
import { computed, onMounted, provide, ref } from 'vue';
import { RouterLink, useRoute } from 'vue-router';
import EmptyState from '../components/EmptyState.vue';
import InternalNoteComposer from '../components/InternalNoteComposer.vue';
import PagePanel from '../components/PagePanel.vue';
import TicketStatusTag from '../components/TicketStatusTag.vue';
import { ticketCollabContextKey } from '../components/conversation-context';
import {
  appendInternalNote,
  fetchOwners,
  fetchTicketConversations,
  fetchTicketDetail,
  fetchTicketEscalationRecords,
  fetchTicketInternalNotes,
  fetchTicketSlaSnapshot,
  fetchTicketTimeline,
  type Conversation,
  type EscalationRecord,
  type InternalNote,
  type Ticket,
  updateTicketStatus,
} from '../data/mock-api';

const AntDescriptionsItem = (AntDescriptions as any).Item;

type TimelineItem = {
  id: string;
  time: string;
  title: string;
  detail?: string;
  kind: 'created' | 'response' | 'status' | 'escalation' | 'assign' | 'collab';
};

const route = useRoute();
const noteComposerRef = ref<any>(null);
const ticket = ref<Ticket | null>(null);
const timeline = ref<TimelineItem[]>([]);
const linkedConversations = ref<Conversation[]>([]);
const internalNotes = ref<InternalNote[]>([]);
const escalationRecords = ref<EscalationRecord[]>([]);
const owners = ref<string[]>([]);
const noteDraft = ref('');
const noteType = ref<'sync' | 'risk' | 'follow-up'>('sync');
const noteMentions = ref<string[]>([]);
const slaSnapshot = ref({
  id: '',
  isDone: false,
  isOverdue: false,
  totalMinutes: 1,
  spentMinutes: 0,
  remainMinutes: 0,
  overdueMinutes: 0,
  progressPercent: 0,
});

const providedTicketId = computed(() => ticket.value?.id || '');

provide(ticketCollabContextKey, {
  ticketId: providedTicketId,
  agents: owners,
  onSubmitted: async () => {
    await loadCollab();
  },
});

const conversationColumns = [
  { title: '会话号', dataIndex: 'id', key: 'id' },
  { title: '渠道', dataIndex: 'channel', key: 'channel' },
  { title: '客户', dataIndex: 'customerName', key: 'customerName' },
  { title: '状态', dataIndex: 'status', key: 'status' },
  { title: '最新触达', dataIndex: 'latestAt', key: 'latestAt' },
];

const formatMinutes = (minutes: number) => {
  const safe = Math.max(0, minutes);
  const h = Math.floor(safe / 60);
  const m = safe % 60;
  return `${h}h ${m}m`;
};

const spentText = computed(() => formatMinutes(slaSnapshot.value.spentMinutes));
const remainText = computed(() => {
  if (slaSnapshot.value.isOverdue) return `超时 ${formatMinutes(slaSnapshot.value.overdueMinutes)}`;
  return formatMinutes(slaSnapshot.value.remainMinutes);
});

const slaProgressStatus = computed(() => {
  if (slaSnapshot.value.isOverdue) return 'exception';
  if (slaSnapshot.value.isDone) return 'success';
  return 'active';
});

const slaProgressColor = computed(() => {
  if (slaSnapshot.value.isOverdue) return '#ff4d4f';
  if (slaSnapshot.value.progressPercent >= 80) return '#faad14';
  return '#1677ff';
});

const slaRiskText = computed(() => {
  if (slaSnapshot.value.isDone) return 'SLA 已完成';
  if (slaSnapshot.value.isOverdue) return 'SLA 已超时';
  if (slaSnapshot.value.progressPercent >= 80) return 'SLA 预警';
  return 'SLA 正常';
});

const slaRiskTagColor = computed(() => {
  if (slaSnapshot.value.isDone) return 'success';
  if (slaSnapshot.value.isOverdue) return 'error';
  if (slaSnapshot.value.progressPercent >= 80) return 'warning';
  return 'processing';
});

const resolveTimelineColor = (kind: TimelineItem['kind']) => {
  if (kind === 'created') return 'blue';
  if (kind === 'response') return 'purple';
  if (kind === 'assign') return 'cyan';
  if (kind === 'escalation') return 'red';
  if (kind === 'collab') return 'gold';
  return 'green';
};

const timelineItems = computed(() =>
  timeline.value.map((item) => ({
    key: item.id,
    color: resolveTimelineColor(item.kind),
    children: `${item.time} · ${item.title}${item.detail ? ` · ${item.detail}` : ''}`,
  })),
);

const loadMain = async () => {
  const id = route.params.id as string;
  ticket.value = await fetchTicketDetail(id);
  timeline.value = await fetchTicketTimeline(id);
  slaSnapshot.value = await fetchTicketSlaSnapshot(id);
};

const loadCollab = async () => {
  const id = route.params.id as string;
  linkedConversations.value = await fetchTicketConversations(id);
  internalNotes.value = await fetchTicketInternalNotes(id);
  escalationRecords.value = await fetchTicketEscalationRecords(id);
};

const load = async () => {
  owners.value = await fetchOwners();
  await loadMain();
  await loadCollab();
};

const update = async (status: Ticket['status']) => {
  if (!ticket.value) return;
  ticket.value = await updateTicketStatus(ticket.value.id, status);
  timeline.value = await fetchTicketTimeline(ticket.value.id);
  slaSnapshot.value = await fetchTicketSlaSnapshot(ticket.value.id);
  await loadCollab();
  message.success('状态更新成功');
};

const onSaveDraft = () => {
  message.success('备注草稿已保留在当前会话');
};

const onSubmitNote = async () => {
  if (!ticket.value || noteDraft.value.trim().length < 10) return;
  await appendInternalNote({
    ticketId: ticket.value.id,
    content: noteDraft.value,
    mentions: noteMentions.value,
    type: noteType.value,
  });
  noteDraft.value = '';
  noteMentions.value = [];
  noteType.value = 'sync';
  await loadCollab();
  timeline.value = await fetchTicketTimeline(ticket.value.id);
  message.success('内部备注已提交');
  noteComposerRef.value?.focusEditor?.();
};

const toOpen = () => update('open');
const toProcessing = () => update('processing');
const toResolved = () => update('resolved');
const toClosed = () => update('closed');

onMounted(load);
</script>

<style scoped>
.page-grid {
  display: grid;
  gap: 12px;
}

.record-list {
  display: grid;
  gap: 10px;
}

.record-item {
  border: 1px solid #e5ebf5;
  border-radius: 12px;
  padding: 12px;
  background: #fff;
}

.record-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
}

.record-item p {
  margin: 6px 0 0;
  color: #4b5563;
  line-height: 1.6;
}
</style>
