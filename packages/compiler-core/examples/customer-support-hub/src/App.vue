<template>
  <div class="app-shell">
    <RouterView v-if="isPublicPage" />

    <AntLayout v-else class-name="shell-layout">
      <component
        :is="AntSider"
        :collapsed="collapsed"
        collapsible
        @collapse="onCollapse"
        width="224"
        class="shell-sider"
      >
        <div class="brand">
          <AntTypographyTitle :level="4" class-name="title">Support Hub</AntTypographyTitle>
          <AntTypographyText type="secondary" class-name="desc">客户支持协同台</AntTypographyText>
        </div>
        <AntMenu
          mode="inline"
          theme="dark"
          :selected-keys="selectedKeys"
          :items="menuItems"
          @click="onMenuClick"
        />
      </component>

      <AntLayout>
        <component :is="AntHeader" class-name="shell-header">
          <div class="header-left">
            <AntBreadcrumb :items="breadcrumbItems" />
          </div>
          <AntSpace>
            <AntAvatar>{{ userInitial }}</AntAvatar>
            <AntTypographyText>{{ userName }}</AntTypographyText>
            <AntButton type="text" @click="logoutNow">退出</AntButton>
          </AntSpace>
        </component>

        <component :is="AntContent" class-name="shell-content">
          <RouterView />
        </component>
      </AntLayout>
    </AntLayout>
  </div>
</template>

<script setup lang="ts">
// @vr-name: CustomerSupportHub
import {
  Avatar as AntAvatar,
  Breadcrumb as AntBreadcrumb,
  Button as AntButton,
  Layout as AntLayout,
  Menu as AntMenu,
  Space as AntSpace,
  Typography as AntTypography,
} from 'antd';
import type { ItemType } from 'antd/es/breadcrumb/Breadcrumb';
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { logout } from './data/mock-api';
import { appStore } from './store/useAppStore';

const route = useRoute();
const router = useRouter();

const AntSider = AntLayout.Sider;
const AntHeader = AntLayout.Header;
const AntContent = AntLayout.Content;
const AntTypographyTitle = AntTypography.Title;
const AntTypographyText = AntTypography.Text;

const collapsed = ref(false);
const userName = ref(appStore.getState().session.user?.name || '访客');

const isPublicPage = computed(() => !!route.meta.public);
const selectedKeys = computed(() => [route.path]);
const userInitial = computed(() => userName.value.slice(0, 1).toUpperCase());

const menuItems = [
  { key: '/dashboard', label: '总览' },
  { key: '/tickets', label: '工单列表' },
  { key: '/customers', label: '客户管理' },
  { key: '/agents', label: '坐席管理' },
  { key: '/knowledge', label: '知识库' },
  { key: '/sla', label: 'SLA 看板' },
  { key: '/settings', label: '设置' },
];

const breadcrumbItems = computed(() => {
  const matched = route.matched.filter((item) => item.path && item.path !== '/');
  if (!matched.length) {
    return [{ title: '总览' }] as ItemType[];
  }

  return matched.map((item) => ({
    title: (item.meta?.title as string) || item.name || '页面',
  })) as ItemType[];
});

appStore.subscribe((state) => {
  userName.value = state.session.user?.name || '访客';
});

const onCollapse = (next: boolean) => {
  collapsed.value = next;
};

const onMenuClick = (info: any) => {
  if (!info?.key) return;
  if (info.key !== route.path) {
    router.push(info.key);
  }
};

const logoutNow = async () => {
  await logout();
  router.push('/login');
};
</script>

<style scoped>
.app-shell {
  min-height: 100vh;
}

.shell-layout {
  min-height: 100vh;
}

.shell-sider {
  border-right: 1px solid #edf1f7;
}

.brand {
  padding: 16px;
  display: grid;
  gap: 2px;
}

.title,
.desc {
  color: #fff;
}

.shell-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  border-bottom: 1px solid #edf1f7;
  padding: 0 20px;
}

.shell-content {
  padding: 16px;
}

.header-left {
  min-width: 0;
}
</style>
