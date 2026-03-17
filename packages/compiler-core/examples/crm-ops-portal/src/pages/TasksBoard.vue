<template>
  <section class="page-section">
    <header class="page-header">
      <div>
        <h2>任务看板</h2>
        <p class="muted">按状态同步团队执行进度与 SLA 风险。</p>
      </div>
      <button class="primary" @click="toggleCreate">添加任务</button>
    </header>

    <div v-if="createOpen" class="create-panel">
      <div class="create-grid">
        <label>
          任务标题
          <input v-model="draft.title" placeholder="例如：准备方案 Demo" />
        </label>
        <label>
          负责人
          <input v-model="draft.owner" placeholder="张琳" />
        </label>
        <label>
          客户
          <input v-model="draft.customer" placeholder="云启物流" />
        </label>
        <label>
          类型
          <input v-model="draft.type" placeholder="回访 / 方案" />
        </label>
        <label>
          优先级
          <select v-model="draft.priority">
            <option value="高">高</option>
            <option value="中">中</option>
            <option value="低">低</option>
          </select>
        </label>
        <label>
          截止时间
          <input v-model="draft.due" placeholder="今天 16:00" />
        </label>
      </div>
      <div class="create-actions">
        <button class="ghost" @click="cancelCreate">取消</button>
        <button class="primary" @click="submitCreate">保存任务</button>
      </div>
    </div>

    <div class="filters">
      <input v-model="keyword" class="input" placeholder="搜索任务/客户" />
      <select v-model="ownerFilter" class="select">
        <option value="all">全部负责人</option>
        <option v-for="owner in owners" :key="owner" :value="owner">{{ owner }}</option>
      </select>
      <select v-model="priorityFilter" class="select">
        <option value="all">全部优先级</option>
        <option value="高">高优先级</option>
        <option value="中">中优先级</option>
        <option value="低">低优先级</option>
      </select>
      <div class="summary">进行中 {{ inProgressCount }} · 阻塞 {{ blockedCount }}</div>
    </div>

    <div class="board">
      <div v-for="column in columns" :key="column" class="column">
        <div class="column-header">
          <h4>{{ column }}</h4>
          <span class="count">{{ getCount(column) }}</span>
        </div>
        <div v-if="getCount(column)" class="card-list">
          <div v-for="task in getColumnTasks(column)" :key="task.id" class="task-card">
            <div class="card-head">
              <strong>{{ task.title }}</strong>
              <StatusPill :label="task.priority" :variant="priorityVariant(task.priority)" />
            </div>
            <p class="muted">客户：{{ task.customer }} · {{ task.type }}</p>
            <div class="meta">负责人：{{ task.owner }} · 截止 {{ task.due }}</div>
            <div class="card-actions">
              <button class="ghost" @click="move(task.id, 'prev')">回退</button>
              <button class="ghost" @click="move(task.id, 'next')">推进</button>
              <button class="link" @click="markDone(task.id)">完成</button>
            </div>
          </div>
        </div>
        <div v-else class="empty">暂无任务</div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
// @vr-name: TasksBoard
import { computed, onMounted, ref } from 'vue';
import StatusPill from '../components/StatusPill.vue';
import { createTask, fetchTasks, updateTaskStatus } from '../data/mock-api';

type Task = Awaited<ReturnType<typeof fetchTasks>>[0];

const columns = ['待开始', '进行中', '阻塞', '已完成'];
const tasks = ref<Task[]>([]);

const keyword = ref('');
const ownerFilter = ref('all');
const priorityFilter = ref('all');

const createOpen = ref(false);
const draft = ref({
  title: '',
  owner: '',
  customer: '',
  type: '',
  priority: '中',
  due: '',
});

const owners = computed(() => {
  return Array.from(new Set(tasks.value.map((task) => task.owner)));
});

const filteredTasks = computed(() => {
  return tasks.value.filter((task) => {
    const hitKeyword = task.title.includes(keyword.value) || task.customer.includes(keyword.value);
    const hitOwner = ownerFilter.value === 'all' || task.owner === ownerFilter.value;
    const hitPriority = priorityFilter.value === 'all' || task.priority === priorityFilter.value;
    return hitKeyword && hitOwner && hitPriority;
  });
});

const getColumnTasks = (column: string) =>
  filteredTasks.value.filter((task) => task.status === column);

const getCount = (column: string) => getColumnTasks(column).length;

const inProgressCount = computed(() => getCount('进行中'));
const blockedCount = computed(() => getCount('阻塞'));

const toggleCreate = () => {
  createOpen.value = !createOpen.value;
};

const cancelCreate = () => {
  createOpen.value = false;
};

const submitCreate = async () => {
  if (!draft.value.title.trim()) return;
  const created = await createTask({
    title: draft.value.title,
    owner: draft.value.owner || '王琪',
    customer: draft.value.customer || '待分配',
    type: draft.value.type || '跟进',
    priority: draft.value.priority,
    due: draft.value.due || '本周',
    status: '待开始',
  });
  tasks.value.unshift(created);
  createOpen.value = false;
  draft.value = { title: '', owner: '', customer: '', type: '', priority: '中', due: '' };
};

const move = async (id: string, direction: 'next' | 'prev') => {
  const task = tasks.value.find((item) => item.id === id);
  if (!task) return;
  const index = columns.indexOf(task.status);
  const nextIndex = direction === 'next' ? index + 1 : index - 1;
  const nextStatus = columns[nextIndex] ?? task.status;
  const updated = await updateTaskStatus(id, nextStatus as Task['status']);
  tasks.value = tasks.value.map((item) => (item.id === updated.id ? updated : item));
};

const markDone = async (id: string) => {
  const updated = await updateTaskStatus(id, '已完成');
  tasks.value = tasks.value.map((item) => (item.id === updated.id ? updated : item));
};

const priorityVariant = (priority: string) => {
  if (priority === '高') return 'danger';
  if (priority === '中') return 'warning';
  return 'info';
};

onMounted(async () => {
  tasks.value = await fetchTasks();
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
}

.create-panel {
  background: #fff;
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 16px;
  display: grid;
  gap: 12px;
}

.create-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
}

.create-grid label {
  display: grid;
  gap: 6px;
  font-size: 12px;
  color: var(--muted);
}

.create-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.filters {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
  align-items: center;
}

.summary {
  font-size: 12px;
  color: var(--muted);
}

.input,
.select {
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid var(--border);
}

.board {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
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
  padding: 10px;
  display: grid;
  gap: 6px;
}

.card-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.meta {
  font-size: 12px;
  color: var(--muted);
}

.card-actions {
  display: flex;
  gap: 6px;
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

.ghost {
  background: transparent;
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 4px 8px;
}

.link {
  background: none;
  border: none;
  color: var(--accent);
  cursor: pointer;
}
</style>
