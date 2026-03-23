<template>
  <section class="page-section">
    <header class="page-header">
      <div>
        <h2>设置</h2>
        <p class="muted">管理工作区、通知规则与服务指标。</p>
      </div>
      <StatusPill :label="themeLabel" variant="info" />
    </header>

    <div class="panel">
      <h3>工作区信息</h3>
      <div class="form">
        <label>
          公司名称
          <input v-model="draft.name" />
        </label>
        <label>
          区域
          <input v-model="draft.region" />
        </label>
        <label>
          套餐
          <select v-model="draft.plan">
            <option value="Growth">Growth</option>
            <option value="Scale">Scale</option>
            <option value="Enterprise">Enterprise</option>
          </select>
        </label>
      </div>
      <div class="actions">
        <button class="primary" @click="apply">保存</button>
        <span v-if="saved" class="saved">已保存</span>
      </div>
    </div>

    <div class="panel">
      <h3>主题设置</h3>
      <div class="theme-grid">
        <button
          v-for="option in themeOptions"
          :key="option.value"
          class="theme-card"
          :class="{ active: theme === option.value }"
          @click="applyTheme(option.value)"
        >
          <strong>{{ option.label }}</strong>
          <span>{{ option.desc }}</span>
        </button>
      </div>
    </div>

    <div class="panel">
      <h3>通知规则</h3>
      <div class="form">
        <label class="row">
          <input type="checkbox" v-model="preferences.dailyDigest" />
          每日进展摘要
        </label>
        <label class="row">
          <input type="checkbox" v-model="preferences.slaAlert" />
          SLA 风险提醒
        </label>
        <label class="row">
          <input type="checkbox" v-model="preferences.pipelineNotify" />
          线索推进提醒
        </label>
      </div>
    </div>

    <div class="panel">
      <h3>SLA 规则</h3>
      <div class="form">
        <label>
          首次响应（小时）
          <input type="number" v-model="sla.firstReply" />
        </label>
        <label>
          每轮跟进（天）
          <input type="number" v-model="sla.followUp" />
        </label>
        <label>
          沉默阈值（天）
          <input type="number" v-model="sla.silentDays" />
        </label>
      </div>
      <div class="actions">
        <button class="ghost" @click="saveSettings">保存规则</button>
        <span v-if="settingsSaved" class="saved">规则已更新</span>
      </div>
    </div>

    <div class="panel">
      <h3>团队成员</h3>
      <div class="team-list">
        <div v-for="member in teamLoad" :key="member.id" class="team-item">
          <div>
            <strong>{{ member.name }}</strong>
            <p class="muted">{{ member.role }}</p>
          </div>
          <div class="muted">
            线索 {{ member.leads }} · 任务 {{ member.tasks }} · SLA {{ member.sla }}
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
// @vr-name: Settings
import { computed, inject, onMounted, ref, watch } from 'vue';
import StatusPill from '../components/StatusPill.vue';
import {
  fetchSettings as fetchSettingsApi,
  fetchTeamLoad,
  updateSettings,
  updateWorkspace,
} from '../data/mock-api';

// 依赖 App 侧 provide，避免在 inject 默认值中触发 ref 的 hook 规则
const workspace = inject('workspace') as any;
const theme = inject('theme') as any;

type Workspace = { name: string; region: string; plan: string };

const draft = ref<Workspace>({ ...workspace.value });
const saved = ref(false);
const settingsSaved = ref(false);

const preferences = ref({
  dailyDigest: true,
  slaAlert: true,
  pipelineNotify: false,
});

const sla = ref({
  firstReply: 4,
  followUp: 3,
  silentDays: 14,
});

const themeOptions = [
  { value: 'ocean', label: '海洋主题', desc: '清爽、通透，适合日常运营' },
  { value: 'forest', label: '森林主题', desc: '沉稳、专注，适合深度分析' },
];

const teamLoad = ref<
  { id: string; name: string; role: string; leads: number; tasks: number; sla: string }[]
>([]);

watch(
  () => workspace.value,
  (next) => {
    draft.value = { ...next };
  },
  { deep: true },
);

const themeLabel = computed(() => (theme.value === 'ocean' ? '海洋主题' : '森林主题'));

const apply = async () => {
  const next = await updateWorkspace({ ...draft.value });
  workspace.value = next;
  saved.value = true;
  setTimeout(() => {
    saved.value = false;
  }, 1200);
};

const applyTheme = (value: 'ocean' | 'forest') => {
  theme.value = value;
};

const saveSettings = async () => {
  await updateSettings({
    preferences: preferences.value,
    sla: sla.value,
  });
  settingsSaved.value = true;
  setTimeout(() => {
    settingsSaved.value = false;
  }, 1200);
};

onMounted(async () => {
  const data = await fetchSettingsApi();
  preferences.value = { ...data.preferences };
  sla.value = { ...data.sla };
  teamLoad.value = await fetchTeamLoad();
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

.panel {
  background: #fff;
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 16px;
}

.form {
  display: grid;
  gap: 12px;
  margin: 12px 0;
}

label {
  display: grid;
  gap: 6px;
  font-size: 12px;
}

label.row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

input,
select {
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px solid var(--border);
}

.actions {
  display: flex;
  align-items: center;
  gap: 12px;
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
  border-radius: 8px;
  padding: 8px 14px;
}

.saved {
  color: var(--accent);
  font-size: 12px;
}

.theme-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.theme-card {
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 12px;
  display: grid;
  gap: 6px;
  background: #fff;
  text-align: left;
  cursor: pointer;
}

.theme-card.active {
  border-color: var(--accent);
  box-shadow: 0 0 0 2px var(--accent-soft);
}

.theme-card span {
  font-size: 12px;
  color: var(--muted);
}

.team-list {
  display: grid;
  gap: 10px;
}

.team-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 10px 12px;
}

.muted {
  color: var(--muted);
}
</style>
