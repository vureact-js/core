<template>
  <PagePanel :title="props.title">
    <template #extra>
      <slot name="header" :total="totalCount" :queue="queueLabel" />
    </template>

    <div class="toolbar">
      <div class="toolbar-summary">
        <strong>已选 {{ props.selectedIds.length }}</strong>
        <span>当前队列：{{ queueLabel }}</span>
      </div>

      <slot
        name="actions"
        :selectedCount="props.selectedIds.length"
        :hasSelection="props.selectedIds.length > 0"
        :clearSelection="clearSelection"
      />
    </div>

    <AntDivider style="margin: 12px 0" />

    <section v-for="group in props.groups" :key="group.key" class="group-block">
      <header class="group-head">
        <div class="group-title">
          <span>{{ group.title }}</span>
          <AntBadge :count="group.items.length" />
        </div>
        <AntButton
          v-if="group.items.length"
          type="link"
          size="small"
          @click="selectGroup(group.items.map((item) => item.id))"
        >
          选中本组
        </AntButton>
      </header>

      <div v-if="group.items.length" class="group-list">
        <article
          v-for="item in group.items"
          :key="item.id"
          class="conversation-card"
          :class="{ active: item.id === props.activeId }"
          @click="onSelect(item.id)"
        >
          <div class="card-head">
            <AntCheckbox
              :checked="props.selectedIds.includes(item.id)"
              @click.stop
              @change="onToggle(item.id)"
            />

            <div class="meta">
              <strong>{{ item.subject }}</strong>
              <span>{{ item.customerName }} · {{ item.latestAt }}</span>
            </div>

            <AntTag :color="resolveStatusColor(item.status)">{{
              resolveStatusText(item.status)
            }}</AntTag>
          </div>

          <slot
            :group="group"
            :item="item"
            :selected="props.selectedIds.includes(item.id)"
            :activate="() => onSelect(item.id)"
            :toggle="() => toggleSelected(item.id)"
          >
            <p class="summary">{{ item.summary }}</p>
            <AntSpace wrap>
              <AntTag color="blue">{{ item.channel }}</AntTag>
              <AntTag color="purple">{{ item.queue }}</AntTag>
              <AntTag v-for="tag in item.tags.slice(0, 3)" :key="tag">{{ tag }}</AntTag>
            </AntSpace>
          </slot>
        </article>
      </div>

      <slot v-else name="empty" :group="group">
        <AntEmpty :description="`暂无${group.title}`" />
      </slot>
    </section>
  </PagePanel>
</template>

<script setup lang="ts">
import {
  Badge as AntBadge,
  Button as AntButton,
  Checkbox as AntCheckbox,
  Divider as AntDivider,
  Empty as AntEmpty,
  Space as AntSpace,
  Tag as AntTag,
} from 'antd';
import { computed, inject } from 'vue';
import type { Conversation, ConversationStatus } from '../data/mock-api';
import PagePanel from './PagePanel.vue';
import { batchActionContextKey, type BatchActionContext } from './conversation-context';

const props = defineProps<{
  title: string;
  groups: Array<{
    key: string;
    title: string;
    items: Conversation[];
  }>;
  selectedIds: string[];
  activeId: string;
}>();

const emit = defineEmits<{
  (e: 'update:selectedIds', value: string[]): void;
  (e: 'select', value: string): void;
}>();

const batchContext = inject<BatchActionContext | null>(batchActionContextKey, null);

const totalCount = computed(() => props.groups.reduce((sum, group) => sum + group.items.length, 0));
const queueLabel = computed(() => {
  if (!batchContext) return '全部队列';
  if (batchContext.queue.value === 'all') return '全部队列';
  return batchContext.queue.value;
});

const resolveStatusText = (status: ConversationStatus) => {
  if (status === 'unassigned') return '待分配';
  if (status === 'processing') return '处理中';
  if (status === 'pending') return '待回复';
  return '待升级';
};

const resolveStatusColor = (status: ConversationStatus) => {
  if (status === 'unassigned') return 'default';
  if (status === 'processing') return 'processing';
  if (status === 'pending') return 'warning';
  return 'error';
};

const emitSelection = (next: string[]) => {
  emit('update:selectedIds', next);
  batchContext?.setSelectedIds(next);
};

const toggleSelected = (id: string) => {
  const set = new Set(props.selectedIds);
  if (set.has(id)) set.delete(id);
  else set.add(id);
  emitSelection(Array.from(set));
};

const onToggle = (id: string) => toggleSelected(id);

const onSelect = (id: string) => {
  emit('select', id);
};

const selectGroup = (ids: string[]) => {
  const set = new Set(props.selectedIds);
  ids.forEach((id) => set.add(id));
  emitSelection(Array.from(set));
};

const clearSelection = () => emitSelection([]);

const selectFirstAvailable = () => {
  const first = props.groups.find((group) => group.items.length)?.items[0];
  if (first) emit('select', first.id);
};

defineExpose({
  clearSelection,
  selectFirstAvailable,
});
</script>

<style scoped>
.toolbar {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
}

.toolbar-summary {
  display: flex;
  gap: 12px;
  color: #6b7280;
  flex-wrap: wrap;
}

.group-block {
  display: grid;
  gap: 10px;
}

.group-block + .group-block {
  margin-top: 16px;
}

.group-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
}

.group-title {
  display: flex;
  gap: 8px;
  align-items: center;
}

.group-list {
  display: grid;
  gap: 10px;
}

.conversation-card {
  border: 1px solid #e5ebf5;
  border-radius: 14px;
  padding: 14px;
  background: #fff;
  cursor: pointer;
  transition: all 0.18s ease;
}

.conversation-card.active {
  border-color: #1677ff;
  box-shadow: 0 10px 24px rgba(22, 119, 255, 0.08);
}

.card-head {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 10px;
  align-items: start;
}

.meta {
  display: grid;
  gap: 4px;
  min-width: 0;
}

.meta strong {
  color: #1f2937;
}

.meta span {
  color: #6b7280;
  font-size: 12px;
}

.summary {
  margin: 10px 0;
  color: #4b5563;
  line-height: 1.6;
}
</style>
