<template>
  <div class="app-shell" :class="themeClass">
    <header class="topbar">
      <div class="brand">
        <div class="logo">CRM</div>
        <div>
          <h1 class="title">{{ workspace.name }}</h1>
          <p class="subtitle">{{ subtitle }}</p>
        </div>
      </div>

      <div class="topbar-center">
        <div class="workspace-meta">
          <span class="label">工作区</span>
          <strong>{{ workspace.name }}</strong>
          <span class="badge">{{ workspace.region }}</span>
        </div>
        <div class="topbar-stats">
          <div v-for="item in workspaceStats" :key="item.id" class="stat">
            <span class="label">{{ item.label }}</span>
            <strong>{{ item.value }}</strong>
            <span class="caption">{{ item.caption }}</span>
          </div>
        </div>
      </div>

      <div class="topbar-actions">
        <div class="user">
          <div class="avatar">{{ userInitials }}</div>
          <div>
            <div class="name">{{ user.name }}</div>
            <div class="role">{{ user.role }}</div>
          </div>
        </div>
        <button class="ghost" @click="toggleTheme">切换主题</button>
        <button class="primary" @click="createLeadAction">新建线索</button>
        <button class="link" @click="handleLogout">退出</button>
      </div>
    </header>

    <div class="announcement" v-show="bannerVisible">
      <span v-html="announcementHtml"></span>
      <button class="link" @click="bannerVisible = false">关闭</button>
    </div>

    <div v-if="actionNotice" class="notice">{{ actionNotice }}</div>

    <div class="layout">
      <aside class="sidebar">
        <RouterLink to="/dashboard" class="nav-item">仪表盘</RouterLink>
        <RouterLink to="/customers" class="nav-item">客户</RouterLink>
        <RouterLink to="/leads" class="nav-item">线索管道</RouterLink>
        <RouterLink to="/tasks" class="nav-item">任务看板</RouterLink>
        <RouterLink to="/notifications" class="nav-item">通知中心</RouterLink>
        <RouterLink to="/approvals" class="nav-item">审批中心</RouterLink>
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
import { computed, onMounted, provide, ref } from 'vue';
import { useRouter } from 'vue-router';
import {
  createLead,
  fetchWorkspace,
  fetchWorkspaceStats,
  getAuthUser,
  logout,
} from './data/mock-api';

const router = useRouter();

const workspace = ref({
  name: '星河科技',
  region: '华东',
  plan: 'Growth',
});

const workspaceStats = ref<{ id: string; label: string; value: string; caption: string }[]>([]);

const theme = ref<'ocean' | 'forest'>('ocean');
const bannerVisible = ref(true);

provide('theme', theme);
provide('workspace', workspace);

const user = ref(
  getAuthUser() || {
    name: '访客',
    role: '运营主管',
    email: 'guest@crm.local',
  },
);

const actionNotice = ref('');

const subtitle = computed(
  () => `${workspace.value.region} · ${workspace.value.plan} · 本月目标追踪`,
);

const themeClass = computed(() => `theme-${theme.value}`);
const userInitials = computed(() => user.value.name.slice(0, 1));

const announcementHtml = '<strong>本周行动</strong>：跟进沉默客户，清理超 14 天未更新线索。';

const toggleTheme = () => {
  theme.value = theme.value === 'ocean' ? 'forest' : 'ocean';
};

const createLeadAction = async () => {
  const lead = await createLead({ owner: user.value.name, name: '新建线索' });
  actionNotice.value = `已创建线索：${lead.name}，已跳转到线索管道。`;
  router.push('/leads');
  setTimeout(() => {
    actionNotice.value = '';
  }, 2000);
};

const handleLogout = async () => {
  await logout();
  router.push('/login');
};

onMounted(async () => {
  workspace.value = await fetchWorkspace();
  workspaceStats.value = await fetchWorkspaceStats();
});
</script>

<style scoped lang="scss">
@import url('./styles/app.scss');

.app-shell {
  min-height: 100vh;
  background: var(--bg);
  color: var(--text);
}

.topbar {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 20px;
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

.title {
  color: var(--text);
}

.subtitle {
  margin: 18px 0 0;
  color: var(--muted);
}

.topbar-center {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.workspace-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--muted);
  font-size: 12px;
}

.workspace-meta strong {
  color: var(--text);
  font-size: 14px;
}

.badge {
  padding: 2px 8px;
  border-radius: 999px;
  background: var(--accent-soft);
  color: var(--accent);
  font-weight: 600;
}

.topbar-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(120px, 1fr));
  gap: 12px;
}

.stat {
  background: rgba(15, 23, 42, 0.04);
  padding: 10px 12px;
  border-radius: 10px;
  display: grid;
  gap: 2px;
}

.stat .label {
  font-size: 12px;
  color: var(--muted);
}

.stat strong {
  font-size: 16px;
}

.stat .caption {
  font-size: 12px;
  color: var(--muted);
}

.topbar-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 10px;
  border-radius: 999px;
  border: 1px solid var(--border);
}

.avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--accent-soft);
  color: var(--accent);
  display: grid;
  place-items: center;
  font-weight: 700;
}

.name {
  font-size: 14px;
  font-weight: 600;
}

.role {
  font-size: 12px;
  color: var(--muted);
}

.primary {
  background: var(--accent);
  color: #fff;
  border: 0;
  padding: 8px 14px;
  border-radius: 8px;
}

.ghost {
  border: 1px solid var(--border);
  padding: 8px 14px;
  border-radius: 8px;
  color: var(--text);
}

.link {
  background: none;
  border: none;
  color: var(--accent);
  cursor: pointer;
}

.announcement {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 24px;
  background: var(--banner);
  border-bottom: 1px solid var(--border);
}

.notice {
  margin: 12px 24px 0;
  padding: 10px 12px;
  border-radius: 10px;
  background: #eef2ff;
  color: #1e3a8a;
  font-size: 12px;
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

@media (max-width: 1200px) {
  .topbar {
    grid-template-columns: 1fr;
  }

  .topbar-actions {
    justify-content: space-between;
    flex-wrap: wrap;
  }

  .topbar-stats {
    grid-template-columns: repeat(2, minmax(120px, 1fr));
  }
}

@media (max-width: 920px) {
  .layout {
    grid-template-columns: 1fr;
  }

  .sidebar {
    flex-direction: row;
    flex-wrap: wrap;
  }

  .topbar-stats {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
