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
  Tag as AntTag,
  Timeline as AntTimeline,
  message,
} from 'antd';
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import PagePanel from '../components/PagePanel.vue';
import TicketStatusTag from '../components/TicketStatusTag.vue';
import {
  fetchTicketDetail,
  fetchTicketSlaSnapshot,
  fetchTicketTimeline,
  type Ticket,
  updateTicketStatus,
} from '../data/mock-api';

const AntDescriptionsItem = (AntDescriptions as any).Item;

type TimelineItem = {
  id: string;
  time: string;
  title: string;
  detail?: string;
  kind: 'created' | 'response' | 'status' | 'escalation' | 'assign';
};

const route = useRoute();
const ticket = ref<Ticket | null>(null);
const timeline = ref<TimelineItem[]>([]);
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
  return 'green';
};

const timelineItems = computed(() =>
  timeline.value.map((item) => ({
    key: item.id,
    color: resolveTimelineColor(item.kind),
    children: `${item.time} · ${item.title}${item.detail ? ` · ${item.detail}` : ''}`,
  })),
);

const load = async () => {
  const id = route.params.id as string;
  ticket.value = await fetchTicketDetail(id);
  timeline.value = await fetchTicketTimeline(id);
  slaSnapshot.value = await fetchTicketSlaSnapshot(id);
};

const update = async (status: Ticket['status']) => {
  if (!ticket.value) return;
  ticket.value = await updateTicketStatus(ticket.value.id, status);
  timeline.value = await fetchTicketTimeline(ticket.value.id);
  slaSnapshot.value = await fetchTicketSlaSnapshot(ticket.value.id);
  message.success('状态更新成功');
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
</style>
