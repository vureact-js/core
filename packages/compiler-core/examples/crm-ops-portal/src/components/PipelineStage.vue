<template>
  <section class="stage">
    <header class="stage-header">
      <h4>{{ props.stage.label }}</h4>
      <span class="count">{{ props.stage.items.length }}</span>
    </header>

    <ul v-if="props.stage.items.length" class="stage-list">
      <li v-for="item in props.stage.items" :key="item.id" class="stage-item">
        <div>
          <strong>{{ item.name }}</strong>
          <p class="muted">负责人：{{ item.owner }}</p>
          <div class="meta">金额 ¥{{ item.value }} 万 · 成交 {{ item.probability }}</div>
          <div class="meta">停留 {{ item.daysInStage }} 天 · {{ item.nextAction }}</div>
        </div>
        <div class="actions">
          <button class="ghost" @click="move(item, 'prev')">回退</button>
          <button class="link" @click="move(item, 'next')">推进</button>
        </div>
      </li>
    </ul>

    <div v-else class="empty">暂无线索</div>
  </section>
</template>

<script setup lang="ts">
// @vr-name: PipelineStage
const props = defineProps<{ stage: { key: string; label: string; items: any[] } }>();
const emit = defineEmits<{
  (e: 'move', payload: { id: string; stage: string; direction: 'next' | 'prev' }): void;
}>();

function move(item: { id: string }, direction: 'next' | 'prev') {
  emit('move', { id: item.id, stage: props.stage.key, direction });
}
</script>

<style scoped>
.stage {
  background: #fff;
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 12px;
  min-width: 220px;
}

.stage-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.stage-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.stage-item {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 8px;
}

.count {
  font-size: 12px;
  color: var(--muted);
}

.muted {
  color: var(--muted);
  font-size: 12px;
  margin: 4px 0 0;
}

.meta {
  font-size: 12px;
  color: var(--muted);
  margin-top: 4px;
}

.empty {
  color: var(--muted);
  font-size: 12px;
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.link {
  background: none;
  border: none;
  color: var(--accent);
  cursor: pointer;
}

.ghost {
  color: #ccc;
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 4px 8px;
}
</style>
