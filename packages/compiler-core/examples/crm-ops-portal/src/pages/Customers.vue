<template>
  <section class="page-section">
    <header class="page-header">
      <div>
        <h2>客户管理</h2>
        <p class="muted">覆盖活跃、沉默与流失客户，支持快速筛选。</p>
      </div>
      <button class="primary" @click="toggleCreate">新建客户</button>
    </header>

    <div v-if="createOpen" class="create-panel">
      <div class="create-grid">
        <label>
          客户名称
          <input v-model="draft.name" placeholder="例如：云启物流" />
        </label>
        <label>
          行业
          <input v-model="draft.industry" placeholder="物流 / 制造 / 金融" />
        </label>
        <label>
          区域
          <input v-model="draft.region" placeholder="华东" />
        </label>
        <label>
          分层
          <select v-model="draft.segment">
            <option value="重点">重点</option>
            <option value="成长">成长</option>
            <option value="观察">观察</option>
            <option value="流失">流失</option>
          </select>
        </label>
        <label>
          负责人
          <input v-model="draft.owner" placeholder="张琳" />
        </label>
        <label>
          联系邮箱
          <input v-model="draft.email" placeholder="contact@corp.com" />
        </label>
      </div>
      <div class="create-actions">
        <button class="ghost" @click="cancelCreate">取消</button>
        <button class="primary" @click="submitCreate">保存客户</button>
      </div>
    </div>

    <FilterBar v-model="keyword" v-model:status="status" v-model:segment="segment" />

    <div class="content">
      <div class="table-area">
        <CustomerTable :customers="filtered" @select="onSelect">
          <template #row="{ customer }">
            <strong>{{ customer.name }}</strong>
            <div class="muted">负责人：{{ customer.owner }}</div>
          </template>
          <template #empty>
            <p>没有找到符合条件的客户</p>
          </template>
        </CustomerTable>

        <div v-if="selected" class="selection">
          已选择：{{ selected.name }}（{{ selected.id }}）
          <button class="link" @click="clearSelection">清除</button>
        </div>
      </div>

      <aside class="detail-card">
        <div v-if="selected">
          <header class="detail-header">
            <div>
              <h3>{{ selected.name }}</h3>
              <p class="muted">{{ selected.industry }} · {{ selected.region }}</p>
            </div>
            <StatusPill :label="selected.status" :variant="statusVariant(selected.status)" />
          </header>
          <div class="detail-grid">
            <div>
              <span class="label">健康度</span>
              <strong>{{ selected.health }}</strong>
            </div>
            <div>
              <span class="label">ARR</span>
              <strong>{{ selected.arr }}</strong>
            </div>
            <div>
              <span class="label">最近跟进</span>
              <strong>{{ selected.lastTouch }}</strong>
            </div>
            <div>
              <span class="label">分层</span>
              <strong>{{ selected.segment }}</strong>
            </div>
          </div>
          <div class="detail-actions">
            <button class="ghost" @click="scheduleFollowup">安排回访</button>
            <button class="primary" @click="recordTouch">记录跟进</button>
          </div>
          <div class="detail-note">下一步：{{ selected.nextAction }}</div>
          <div class="detail-contact">
            <span>电话：{{ selected.phone }}</span>
            <span>邮箱：{{ selected.email }}</span>
          </div>

          <section class="notes">
            <header class="notes-header">
              <h4>跟进记录</h4>
              <span class="muted" v-if="noteLoading">加载中...</span>
            </header>
            <div v-if="!noteLoading && !notes.length" class="empty">暂无记录</div>
            <ul v-else class="note-list">
              <li v-for="note in notes" :key="note.id" class="note-item">
                <div class="note-head">
                  <strong>{{ note.author }}</strong>
                  <span class="note-time">{{ note.time }}</span>
                </div>
                <p>{{ note.content }}</p>
              </li>
            </ul>
            <div class="note-editor">
              <textarea v-model="noteDraft" placeholder="记录本次沟通要点"></textarea>
              <button class="primary" @click="submitNote">添加记录</button>
            </div>
          </section>
        </div>
        <div v-else class="empty">选择客户查看详情</div>
      </aside>
    </div>
  </section>
</template>

<script setup lang="ts">
// @vr-name: Customers
import { computed, onMounted, ref, watch } from 'vue';
import CustomerTable from '../components/CustomerTable.vue';
import FilterBar from '../components/FilterBar.vue';
import StatusPill from '../components/StatusPill.vue';
import {
  addCustomerNote,
  createCustomer,
  fetchCustomerNotes,
  fetchCustomers,
  getAuthUser,
  updateCustomer,
} from '../data/mock-api';

const customers = ref<Awaited<ReturnType<typeof fetchCustomers>>>([]);

const keyword = ref('');
const status = ref('all');
const segment = ref('all');
const selected = ref<(typeof customers.value)[0] | null>(null);

const notes = ref<Awaited<ReturnType<typeof fetchCustomerNotes>>>([]);
const noteDraft = ref('');
const noteLoading = ref(false);

const createOpen = ref(false);
const draft = ref({
  name: '',
  industry: '',
  region: '',
  segment: '重点',
  owner: '',
  email: '',
});

const filtered = computed(() => {
  return customers.value.filter((item) => {
    const hitKeyword =
      item.name.includes(keyword.value) ||
      item.owner.includes(keyword.value) ||
      item.industry.includes(keyword.value);
    const hitStatus = status.value === 'all' || item.status === status.value;
    const hitSegment = segment.value === 'all' || item.segment === segment.value;
    return hitKeyword && hitStatus && hitSegment;
  });
});

const onSelect = (customer: (typeof customers.value)[0]) => {
  selected.value = customer;
};

const clearSelection = () => {
  selected.value = null;
};

const toggleCreate = () => {
  createOpen.value = !createOpen.value;
};

const cancelCreate = () => {
  createOpen.value = false;
};

const submitCreate = async () => {
  if (!draft.value.name.trim()) return;
  const created = await createCustomer({
    name: draft.value.name,
    industry: draft.value.industry || '通用行业',
    region: draft.value.region || '华东',
    segment: draft.value.segment,
    owner: draft.value.owner || '张琳',
    email: draft.value.email || 'contact@crm.local',
    status: '活跃',
    arr: '¥ 60 万',
    health: '良好',
    nextAction: '安排首次回访',
    phone: '021-8888-0000',
  });
  customers.value.unshift(created);
  selected.value = created;
  createOpen.value = false;
  draft.value = {
    name: '',
    industry: '',
    region: '',
    segment: '重点',
    owner: '',
    email: '',
  };
};

const scheduleFollowup = async () => {
  if (!selected.value) return;
  const updated = await updateCustomer(selected.value.id, {
    nextAction: '已安排回访（明天 10:00）',
    lastTouch: '今天',
  });
  selected.value = updated;
  customers.value = customers.value.map((item) => (item.id === updated.id ? updated : item));
};

const recordTouch = async () => {
  if (!selected.value) return;
  const updated = await updateCustomer(selected.value.id, {
    lastTouch: '刚刚',
    health: '跟进中',
    nextAction: '等待客户反馈',
  });
  selected.value = updated;
  customers.value = customers.value.map((item) => (item.id === updated.id ? updated : item));
};

const loadNotes = async (customerId: string) => {
  noteLoading.value = true;
  notes.value = await fetchCustomerNotes(customerId);
  noteLoading.value = false;
};

const submitNote = async () => {
  if (!selected.value) return;
  if (!noteDraft.value.trim()) return;
  const author = getAuthUser()?.name || '系统';
  const created = await addCustomerNote({
    customerId: selected.value.id,
    author,
    content: noteDraft.value.trim(),
  });
  notes.value.unshift(created);
  noteDraft.value = '';
};

const statusVariant = (value: string) => {
  if (value === '活跃') return 'success';
  if (value === '沉默') return 'warning';
  return 'danger';
};

onMounted(async () => {
  customers.value = await fetchCustomers();
});

watch(
  () => selected.value?.id,
  (next) => {
    if (!next) {
      notes.value = [];
      return;
    }
    loadNotes(next);
  },
);
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

.content {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(280px, 0.8fr);
  gap: 16px;
  align-items: start;
}

.table-area {
  display: grid;
  gap: 12px;
}

.muted {
  color: var(--muted);
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
}

.selection {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border-radius: 10px;
  background: var(--accent-soft);
  color: var(--accent);
}

.link {
  background: none;
  border: none;
  color: var(--accent);
  cursor: pointer;
}

.detail-card {
  background: #fff;
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 16px;
  display: grid;
  gap: 12px;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.label {
  display: block;
  font-size: 12px;
  color: var(--muted);
}

.detail-actions {
  display: flex;
  gap: 8px;
}

.detail-note {
  padding: 10px 12px;
  background: var(--banner);
  border-radius: 10px;
  font-size: 12px;
}

.detail-contact {
  display: grid;
  gap: 6px;
  font-size: 12px;
  color: var(--muted);
}

.notes {
  display: grid;
  gap: 10px;
  padding-top: 8px;
  border-top: 1px solid var(--border);
}

.notes-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.note-list {
  display: grid;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.note-item {
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 10px 12px;
  background: #fafafa;
}

.note-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: var(--muted);
  margin-bottom: 6px;
}

.note-time {
  color: var(--muted);
}

.note-editor {
  display: grid;
  gap: 8px;
}

.note-editor textarea {
  min-height: 80px;
  border-radius: 10px;
  border: 1px solid var(--border);
  padding: 10px;
  resize: vertical;
  font-family: inherit;
}

.empty {
  text-align: center;
  color: var(--muted);
}

input,
select {
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px solid var(--border);
}

@media (max-width: 1100px) {
  .content {
    grid-template-columns: 1fr;
  }
}
</style>
