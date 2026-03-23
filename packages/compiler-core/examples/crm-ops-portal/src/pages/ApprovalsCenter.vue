<template>
  <section class="page-section">
    <header class="page-header">
      <div>
        <h2>审批中心</h2>
        <p class="muted">处理高价值线索、预算和折扣等审批。</p>
      </div>
      <button class="primary" @click="openCreate = !openCreate">发起审批</button>
    </header>

    <div v-if="openCreate" class="create-panel">
      <div class="grid">
        <label>
          标题
          <input v-model="draft.title" placeholder="例如：高价值线索资源申请" />
        </label>
        <label>
          类型
          <select v-model="draft.type">
            <option value="高价值线索">高价值线索</option>
            <option value="预算审批">预算审批</option>
            <option value="折扣审批">折扣审批</option>
          </select>
        </label>
        <label>
          关联对象
          <input v-model="draft.target" placeholder="客户/线索名称" />
        </label>
        <label>
          金额（万）
          <input v-model.number="draft.amount" type="number" placeholder="100" />
        </label>
      </div>
      <label>
        申请原因
        <textarea v-model="draft.reason" placeholder="请描述审批背景与预期收益"></textarea>
      </label>
      <div class="actions">
        <button class="ghost" @click="openCreate = false">取消</button>
        <button class="primary" @click="submitApproval">提交审批</button>
      </div>
      <p v-if="createError" class="error">{{ createError }}</p>
    </div>

    <div class="filters">
      <select v-model="statusFilter" class="select">
        <option value="all">全部状态</option>
        <option value="pending">待审批</option>
        <option value="approved">已通过</option>
        <option value="rejected">已驳回</option>
      </select>
      <input v-model="keyword" class="input" placeholder="搜索标题/对象" />
      <button class="ghost" @click="reload">刷新</button>
    </div>

    <div v-if="notice" class="notice">{{ notice }}</div>

    <div class="content">
      <section class="list-wrap">
        <div v-if="loading" class="empty">加载中...</div>
        <div v-else-if="!items.length" class="empty">暂无审批单</div>
        <ul v-else class="list">
          <li
            v-for="item in items"
            :key="item.id"
            class="item"
            :class="{ active: currentId === item.id }"
            @click="select(item.id)"
          >
            <div class="item-head">
              <strong>{{ item.title }}</strong>
              <span class="status" :class="item.status">{{ statusText(item.status) }}</span>
            </div>
            <p class="muted">{{ item.type }} · {{ item.target }}</p>
            <p class="meta">申请人 {{ item.createdBy }} · {{ item.createdAt }}</p>
          </li>
        </ul>
      </section>

      <aside class="detail" v-if="current">
        <h3>{{ current.title }}</h3>
        <p class="muted">{{ current.type }} · {{ current.target }}</p>
        <p class="meta">申请金额：{{ current.amount ? `¥ ${current.amount} 万` : '未填写' }}</p>
        <p class="reason">{{ current.reason }}</p>

        <div class="review" v-if="current.status === 'pending'">
          <textarea v-model="reviewComment" placeholder="审批备注（驳回必填）"></textarea>
          <div class="actions">
            <button class="primary" @click="review('approve')">通过</button>
            <button class="danger" @click="review('reject')">驳回</button>
          </div>
          <p v-if="reviewError" class="error">{{ reviewError }}</p>
        </div>

        <section class="history">
          <h4>审批历史</h4>
          <ul>
            <li v-for="row in history" :key="row.id">
              <strong>{{ actionText(row.action) }}</strong>
              <span>{{ row.operator }}</span>
              <span class="meta">{{ row.createdAt }}</span>
              <p class="muted" v-if="row.comment">{{ row.comment }}</p>
            </li>
          </ul>
        </section>
      </aside>
      <aside class="detail empty" v-else>选择审批单查看详情</aside>
    </div>
  </section>
</template>

<script setup lang="ts">
// @vr-name: ApprovalsCenter
import { computed, onMounted, ref, watch } from 'vue';
import {
  createApproval,
  fetchApprovalHistory,
  fetchApprovals,
  reviewApproval,
} from '../data/mock-api';

const openCreate = ref(false);
const createError = ref('');
const reviewError = ref('');
const notice = ref('');

const loading = ref(false);
const statusFilter = ref<'all' | 'pending' | 'approved' | 'rejected'>('all');
const keyword = ref('');

const draft = ref({
  title: '',
  type: '高价值线索',
  target: '',
  amount: 100,
  reason: '',
});

const reviewComment = ref('');
const currentId = ref('');

const items = ref<Awaited<ReturnType<typeof fetchApprovals>>>([]);
const history = ref<Awaited<ReturnType<typeof fetchApprovalHistory>>>([]);

const current = computed(() => items.value.find((item) => item.id === currentId.value) || null);

const statusText = (status: string) => {
  if (status === 'pending') return '待审批';
  if (status === 'approved') return '已通过';
  return '已驳回';
};

const actionText = (action: string) => {
  if (action === 'create') return '发起';
  if (action === 'approve') return '通过';
  return '驳回';
};

const reload = async () => {
  loading.value = true;
  items.value = await fetchApprovals({ status: statusFilter.value, keyword: keyword.value });
  if (!items.value.length) {
    currentId.value = '';
    history.value = [];
    loading.value = false;
    return;
  }

  if (!currentId.value || !items.value.some((item) => item.id === currentId.value)) {
    currentId.value = items.value[0]!.id;
  }
  history.value = await fetchApprovalHistory(currentId.value);
  loading.value = false;
};

const select = async (id: string) => {
  currentId.value = id;
  history.value = await fetchApprovalHistory(id);
};

const submitApproval = async () => {
  createError.value = '';
  if (!draft.value.title.trim() || !draft.value.target.trim() || !draft.value.reason.trim()) {
    createError.value = '请完整填写审批信息。';
    return;
  }
  const next = await createApproval({
    title: draft.value.title,
    type: draft.value.type,
    target: draft.value.target,
    amount: draft.value.amount,
    reason: draft.value.reason,
  });
  notice.value = `审批单「${next.title}」已提交。`;
  openCreate.value = false;
  draft.value = { title: '', type: '高价值线索', target: '', amount: 100, reason: '' };
  await reload();
  currentId.value = next.id;
  history.value = await fetchApprovalHistory(next.id);
};

const review = async (action: 'approve' | 'reject') => {
  if (!current.value) return;
  reviewError.value = '';
  if (action === 'reject' && !reviewComment.value.trim()) {
    reviewError.value = '驳回时请填写原因。';
    return;
  }
  await reviewApproval({
    id: current.value.id,
    action,
    comment: reviewComment.value.trim() || undefined,
  });
  notice.value = action === 'approve' ? '审批已通过。' : '审批已驳回。';
  reviewComment.value = '';
  await reload();
  history.value = await fetchApprovalHistory(current.value.id);
};

watch(statusFilter, () => {
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

.create-panel,
.list-wrap,
.detail {
  background: #fff;
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 14px;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 10px;
}

label {
  display: grid;
  gap: 6px;
  font-size: 12px;
}

.input,
.select,
input,
textarea {
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 8px 10px;
}

textarea {
  min-height: 80px;
  resize: vertical;
  font-family: inherit;
}

.filters {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 10px;
}

.content {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(320px, 0.9fr);
  gap: 12px;
}

.list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 8px;
}

.item {
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 10px;
  cursor: pointer;
}

.item.active {
  border-color: var(--accent);
  box-shadow: 0 0 0 2px var(--accent-soft);
}

.item-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.status {
  font-size: 12px;
  border-radius: 999px;
  padding: 2px 8px;
}

.status.pending {
  background: #fef3c7;
  color: #92400e;
}

.status.approved {
  background: #dcfce7;
  color: #166534;
}

.status.rejected {
  background: #fee2e2;
  color: #991b1b;
}

.reason {
  white-space: pre-wrap;
  line-height: 1.4;
}

.history ul {
  margin: 0;
  padding-left: 18px;
  display: grid;
  gap: 8px;
}

.actions {
  display: flex;
  gap: 8px;
  margin-top: 10px;
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
  padding: 8px 12px;
}

.danger {
  background: #dc2626;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 8px 12px;
}

.notice {
  padding: 10px 12px;
  border-radius: 10px;
  background: var(--banner);
  font-size: 12px;
}

.error {
  color: #dc2626;
  font-size: 12px;
}

.muted,
.meta,
.empty {
  color: var(--muted);
  font-size: 12px;
}

@media (max-width: 1080px) {
  .content {
    grid-template-columns: 1fr;
  }
}
</style>
