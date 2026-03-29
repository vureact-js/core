<template>
  <div class="app-shell" :class="themeClass">
    <RouterView v-if="isPublicPage" />

    <template v-else>
      <header class="topbar">
        <div>
          <h1>客户支持协同台</h1>
          <p>工单、知识库与 SLA 的统一协同视图</p>
        </div>
        <div class="user">
          <span>{{ userName }}</span>
          <button class="ghost" @click="logoutNow">退出</button>
        </div>
      </header>

      <div class="layout">
        <aside class="sidebar">
          <RouterLink to="/dashboard" class="nav-item">总览</RouterLink>
          <RouterLink to="/tickets" class="nav-item">工单列表</RouterLink>
          <RouterLink to="/knowledge" class="nav-item">知识库</RouterLink>
          <RouterLink to="/sla" class="nav-item">SLA 看板</RouterLink>
          <RouterLink to="/settings" class="nav-item">设置</RouterLink>
        </aside>

        <main class="content">
          <RouterView />
        </main>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
// @vr-name: CustomerSupportHub
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { logout } from './data/mock-api';
import { appStore } from './store/useAppStore';

const route = useRoute();
const router = useRouter();

const userName = ref(appStore.getState().session.user?.name || '访客');
const themeClass = computed(() => `theme-${appStore.getState().uiPrefs.theme}`);

appStore.subscribe((state) => {
  userName.value = state.session.user?.name || '访客';
});

const isPublicPage = computed(() => !!route.meta.public);

const logoutNow = async () => {
  await logout();
  router.push('/login');
};
</script>

<style scoped>
.app-shell {
  min-height: 100vh;
  background: var(--bg);
  color: var(--text);
}

.topbar {
  padding: 18px 22px;
  border-bottom: 1px solid var(--border);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--panel);
}

.topbar h1 {
  margin: 0;
  font-size: 20px;
}

.topbar p {
  margin: 6px 0 0;
  color: var(--muted);
  font-size: 12px;
}

.layout {
  display: grid;
  grid-template-columns: 220px 1fr;
  gap: 18px;
  padding: 18px 22px;
}

.sidebar {
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--panel);
  padding: 12px;
  display: grid;
  gap: 6px;
  align-content: start;
}

.nav-item {
  border-radius: 8px;
  padding: 8px 10px;
  color: var(--text);
}

.nav-item.router-link-active {
  background: var(--accent-soft);
  color: var(--accent);
  font-weight: 600;
}

.content {
  display: grid;
  gap: 16px;
}

.user {
  display: flex;
  align-items: center;
  gap: 10px;
}

.ghost {
  border: 1px solid var(--border);
  background: transparent;
  border-radius: 8px;
  padding: 6px 10px;
}

@media (max-width: 980px) {
  .layout {
    grid-template-columns: 1fr;
  }

  .sidebar {
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  }
}
</style>
