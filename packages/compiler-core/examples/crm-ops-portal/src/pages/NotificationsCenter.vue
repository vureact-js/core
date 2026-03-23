<template>
  <section class="page-section">
    <header class="page-header">
      <div>
        <h2>通知中心</h2>
        <p class="muted">统一处理系统通知、审批提醒与任务风险。</p>
      </div>
      <button class="ghost" @click="markAllRead">全部标记已读</button>
    </header>

    <div class="filters">
      <select v-model="statusFilter" class="select">
        <option value="all">全部状态</option>
        <option value="unread">未读</option>
        <option value="archived">已归档</option>
      </select>
      <select v-model="typeFilter" class="select">
        <option value="all">全部类型</option>
        <option value="system">系统</option>
        <option value="approval">审批</option>
        <option value="lead">线索</option>
        <option value="task">任务</option>
      </select>
      <input v-model="keyword" class="input" placeholder="搜索标题/内容" />
      <button class="primary" @click="reload">刷新</button>
    </div>

    <div v-if="notice" class="notice">{{ notice }}</div>

    <div v-if="loading" class="empty">加载中...</div>
    <div v-else-if="!items.length" class="empty">暂无通知</div>
    <ul v-else class="list">
      <li v-for="item in items" :key="item.id" class="card" :class="item.status">
        <div class="card-head">
          <div>
            <strong>{{ item.title }}</strong>
            <p class="muted">{{ item.content }}</p>
          </div>
          <span class="badge">{{ typeText(item.type) }}</span>
        </div>
        <div class="card-meta">
          <span>{{ item.createdAt }}</span>
          <span v-show="item.status === 'unread'" class="dot">未读</span>
          <span v-show="item.status === 'archived'">已归档</span>
        </div>
        <div class="card-actions">
          <button class="ghost" @click="readOne(item.id)" :disabled="item.status === 'archived'">
            标记已读
          </button>
          <button class="link" @click="archiveOne(item.id)" :disabled="item.status === 'archived'">
            归档
          </button>
        </div>
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
// @vr-name: NotificationsCenter
import { computed, onMounted, ref, watch } from 'vue';
import {
  archiveNotification,
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../data/mock-api';

const statusFilter = ref<'all' | 'unread' | 'archived'>('all');
const typeFilter = ref('all');
const keyword = ref('');
const loading = ref(false);
const notice = ref('');

const allItems = ref<Awaited<ReturnType<typeof fetchNotifications>>>([]);

const items = computed(() => allItems.value);

const typeText = (type: string) => {
  if (type === 'approval') return '审批';
  if (type === 'task') return '任务';
  if (type === 'lead') return '线索';
  return '系统';
};

const reload = async () => {
  loading.value = true;
  allItems.value = await fetchNotifications({
    status: statusFilter.value,
    type: typeFilter.value,
    keyword: keyword.value,
  });
  loading.value = false;
};

const readOne = async (id: string) => {
  await markNotificationRead(id);
  notice.value = '通知已标记已读。';
  await reload();
};

const archiveOne = async (id: string) => {
  await archiveNotification(id);
  notice.value = '通知已归档。';
  await reload();
};

const markAllRead = async () => {
  await markAllNotificationsRead();
  notice.value = '所有通知已标记已读。';
  await reload();
};

watch([statusFilter, typeFilter], () => {
  reload();
});

onMounted(() => {
  reload();
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

.filters {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 10px;
}

.input,
.select {
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: 8px;
}

.list {
  display: grid;
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.card {
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 12px;
  display: grid;
  gap: 8px;
  background: #fff;
}

.card.unread {
  border-color: var(--accent);
}

.card-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.badge {
  font-size: 12px;
  color: var(--accent);
  background: var(--accent-soft);
  border-radius: 999px;
  padding: 2px 8px;
  height: fit-content;
}

.card-meta {
  display: flex;
  gap: 10px;
  color: var(--muted);
  font-size: 12px;
}

.dot {
  color: #dc2626;
}

.card-actions {
  display: flex;
  gap: 8px;
}

.primary {
  background: var(--accent);
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 8px 12px;
}

.ghost {
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 6px 10px;
}

.link {
  background: none;
  border: none;
  color: var(--accent);
}

.notice {
  padding: 10px 12px;
  border-radius: 10px;
  background: var(--banner);
  font-size: 12px;
}

.muted,
.empty {
  color: var(--muted);
}
</style>
