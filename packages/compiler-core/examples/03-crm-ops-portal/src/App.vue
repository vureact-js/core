<template>
  <div class="app-shell" :class="themeClass">
    <header class="topbar">
      <div class="brand">
        <div class="logo">CRM</div>
        <div>
          <h1>{{ workspace.name }}</h1>
          <p class="subtitle">{{ subtitle }}</p>
        </div>
      </div>
      <div class="actions">
        <button class="ghost" @click="toggleTheme">切换主题</button>
        <button class="primary">新建线索</button>
      </div>
    </header>

    <div class="announcement" v-show="bannerVisible">
      <span v-html="announcementHtml"></span>
      <button class="link" @click="bannerVisible = false">关闭</button>
    </div>

    <div class="layout">
      <aside class="sidebar">
        <RouterLink to="/" class="nav-item">仪表盘</RouterLink>
        <RouterLink to="/customers" class="nav-item">客户</RouterLink>
        <RouterLink to="/leads" class="nav-item">线索管道</RouterLink>
        <RouterLink to="/tasks" class="nav-item">任务看板</RouterLink>
        <RouterLink to="/settings" class="nav-item">设置</RouterLink>
      </aside>

      <main class="page">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
// @vr-name: CrmOpsPortal
import { computed, provide, ref } from 'vue';

const workspace = ref({
  name: '星河科技',
  region: '华东',
  plan: 'Growth',
});

const theme = ref<'ocean' | 'forest'>('ocean');
const bannerVisible = ref(true);

provide('theme', theme);
provide('workspace', workspace);

const subtitle = computed(
  () => `${workspace.value.region} · ${workspace.value.plan} · 本月目标追踪`,
);

const themeClass = computed(() => `theme-${theme.value}`);

const announcementHtml =
  '<strong>本周行动</strong>：跟进沉默客户，清理超 14 天未更新线索。';

const toggleTheme = () => {
  theme.value = theme.value === 'ocean' ? 'forest' : 'ocean';
};
</script>

<style scoped lang="scss">
.app-shell {
  min-height: 100vh;
  background: var(--bg);
  color: var(--text);
}

.topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  background: var(--panel);
  border-bottom: 1px solid var(--border);
}

.brand {
  display: flex;
  gap: 12px;
  align-items: center;
}

.logo {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  background: var(--accent);
  color: #fff;
  display: grid;
  place-items: center;
  font-weight: 700;
}

.subtitle {
  margin: 4px 0 0;
  color: var(--muted);
}

.actions {
  display: flex;
  gap: 12px;
}

.primary {
  background: var(--accent);
  color: #fff;
  border: 0;
  padding: 8px 14px;
  border-radius: 8px;
}

.ghost {
  background: transparent;
  border: 1px solid var(--border);
  padding: 8px 14px;
  border-radius: 8px;
  color: var(--text);
}

.announcement {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 24px;
  background: var(--banner);
  border-bottom: 1px solid var(--border);
}

.link {
  background: none;
  border: none;
  color: var(--accent);
  cursor: pointer;
}

.layout {
  display: grid;
  grid-template-columns: 220px 1fr;
  gap: 20px;
  padding: 20px 24px;
}

.sidebar {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 16px;
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: 12px;
  height: fit-content;
}

.nav-item {
  padding: 10px 12px;
  border-radius: 8px;
  color: var(--text);
}

.nav-item.router-link-active {
  background: var(--accent-soft);
  color: var(--accent);
  font-weight: 600;
}

.page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

@media (max-width: 920px) {
  .layout {
    grid-template-columns: 1fr;
  }

  .sidebar {
    flex-direction: row;
    flex-wrap: wrap;
  }
}
</style>
