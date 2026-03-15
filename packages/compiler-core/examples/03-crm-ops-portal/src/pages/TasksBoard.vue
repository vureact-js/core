<template>
  <section class="page-section">
    <header class="page-header">
      <div>
        <h2>任务看板</h2>
        <p class="muted">按状态同步团队执行进度。</p>
      </div>
      <button class="primary">添加任务</button>
    </header>

    <div class="board">
      <div v-for="column in columns" :key="column" class="column">
        <div class="column-header">
          <h4>{{ column }}</h4>
          <span class="count">{{ getCount(column) }}</span>
        </div>
        <div v-if="getCount(column)" class="card-list">
          <div v-for="task in getColumnTasks(column)" :key="task.id" class="task-card">
            <strong>{{ task.title }}</strong>
            <p class="muted">负责人：{{ task.owner }}</p>
          </div>
        </div>
        <div v-else class="empty">暂无任务</div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
// @vr-name: TasksBoard
import { tasks } from '../data/mock';

const columns = ['待开始', '进行中', '已完成'];

const getColumnTasks = (column: string) => tasks.filter((task) => task.status === column);
const getCount = (column: string) => getColumnTasks(column).length;
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
}

.board {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
}

.column {
  background: #fff;
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.column-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.task-card {
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 8px;
}

.count,
.muted,
.empty {
  color: var(--muted);
  font-size: 12px;
}

.primary {
  background: var(--accent);
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 8px 14px;
}
</style>
