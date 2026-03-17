<template>
  <section class="card">
    <header class="card-header">
      <div>
        <h3>{{ props.title }}</h3>
        <p class="hint">{{ props.hint }}</p>
      </div>
      <span class="theme">{{ themeValue }}</span>
    </header>

    <div class="card-body">
      <slot>
        <p>当前工作区：{{ workspaceValue.name }}</p>
      </slot>
    </div>

    <footer class="card-footer">
      <slot name="footer" :workspace="workspaceValue">
        <small>{{ workspaceValue.region }} · {{ workspaceValue.plan }}</small>
      </slot>
    </footer>
  </section>
</template>

<script setup lang="ts">
// @vr-name: ThemeCard
import { computed, inject, watch } from 'vue';

type Workspace = { name: string; region: string; plan: string };

const props = defineProps<{ title: string; hint: string }>();

// 依赖 App 侧 provide，避免在 inject 默认值中触发 ref 的 hook 规则
const theme = inject('theme') as any;
const workspace = inject('workspace') as any;

const themeValue = computed(() => (theme.value === 'ocean' ? '海洋主题' : '森林主题'));
const workspaceValue = computed(() => workspace.value);

watch(
  () => themeValue,
  (newVal) => {
    alert(`useWatch: ${newVal}`);
  },
);
</script>

<style scoped>
.card {
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 16px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.hint {
  margin: 4px 0 0;
  color: var(--muted);
  font-size: 12px;
}

.theme {
  font-size: 12px;
  color: var(--accent);
  font-weight: 600;
}

.card-body {
  margin-top: 12px;
}

.card-footer {
  margin-top: 12px;
  color: var(--muted);
}
</style>
