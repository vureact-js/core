<template>
  <section class="page-section">
    <header class="page-header">
      <div>
        <h2>设置</h2>
        <p class="muted">管理工作区与主题偏好。</p>
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
      <button class="primary" @click="apply">保存</button>
      <span v-if="saved" class="saved">已保存</span>
    </div>
  </section>
</template>

<script setup lang="ts">
// @vr-name: Settings
import { computed, inject, ref, watch } from 'vue';
import StatusPill from '../components/StatusPill.vue';

type Workspace = { name: string; region: string; plan: string };

// 依赖 App 侧 provide，避免在 inject 默认值中触发 ref 的 hook 规则
const workspace = inject('workspace') as any;
const theme = inject('theme') as any;

const draft = ref<Workspace>({ ...workspace.value });
const saved = ref(false);

watch(
  () => workspace.value,
  (next) => {
    draft.value = { ...next };
  },
  { deep: true },
);

const themeLabel = computed(() => (theme.value === 'ocean' ? '海洋主题' : '森林主题'));

const apply = () => {
  workspace.value = { ...draft.value };
  saved.value = true;
  setTimeout(() => {
    saved.value = false;
  }, 1200);
};
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

input,
select {
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px solid var(--border);
}

.primary {
  background: var(--accent);
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 8px 14px;
}

.saved {
  margin-left: 12px;
  color: var(--accent);
}

.muted {
  color: var(--muted);
}
</style>
