# 路由适配指南

## 概述

VuReact 对 Vue Router 提供了完整的转换支持，但由于路由是工程级上下文，编译后仍需要一些人工调整。

### 自动转换的部分

- `<router-link>` → `<RouterLink>`
- `<router-view>` → `<RouterView>`
- 路由API调用：`useRouter()`, `useRoute()`等
- 自动注入`@vureact/router`依赖

### 需要人工调整的部分

- 路由配置文件格式转换
- 入口文件渲染方式
- 排除配置设置

## 配置步骤

### 步骤1：编译前的准备

确保你的Vue项目使用标准Vue Router配置。

### 步骤2：执行编译

```bash
npx vureact build

# 或手动配置 npm 命令
npm run vr:build
```

### 步骤3：调整输出的 React 项目（关键步骤）

#### 3.1 更新入口文件（src/main.tsx）

示例：

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import router from './router';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <router.RouterProvider />
  </StrictMode>,
);
```

**重要变化**：

- 导入路由提供器，不需要渲染 `<App />`，因为 `App` 应该在路由配置中挂载。

#### 3.2 转换路由配置文件

实际以你项目输出的路由配置结构为准。

将 `src/router/index.ts` 改为 `src/router/index.tsx`。

示例：

```tsx
import { createRouter, createWebHashHistory } from '@vureact/router';
import App from '../App';
import Dashboard from '../pages/Dashboard';
import Customers from '../pages/Customers';

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      component: <App />,
      children: [
        { path: 'dashboard', component: <Dashboard /> },
        { path: 'customers', component: <Customers /> },
      ],
    },
  ],
});

export default router;
```

**重要变化**：

- 文件扩展名：`.ts` → `.tsx`
- 导出 `createRouter` 路由器实例
- 组件语法：`component: Dashboard` → `component: <Dashboard />`
- 导入方式：保持React组件导入

#### 3.3 配置排除项

在 `vureact.config.js` 中添加排除配置，防止重新编译时覆盖手动调整的文件。

若后续需要修改这些文件，需**手动同步**变更。

示例：

```js
export default defineConfig({
  exclude: [
    'src/main.ts',
    'src/router/**', // 排除整个路由目录
  ],
});
```

### 步骤4：验证与测试

1. 安装依赖：`npm install`
2. 启动项目：`npm run dev`
3. 测试路由跳转
4. 验证嵌套路由

## 常见问题

### Q1: 页面空白，控制台报错

**可能原因**：路由配置文件未转换为JSX语法
**解决方案**：

1. 确认文件扩展名为`.tsx`或`.jsx`
2. 检查组件是否使用`<Component />`语法
3. 确保正确导入React组件

### Q2: 路由跳转404

**可能原因**：历史模式配置错误
**解决方案**：

- 检查`createWebHashHistory` vs `createWebHistory`
- 确认base路径配置

### Q3: 嵌套路由不显示内容

**可能原因**：父组件缺少`<RouterView />`
**解决方案**：
在布局组件中添加路由出口：

```vue
<!-- Vue原版 -->
<template>
  <div>
    <header>...</header>
    <router-view />
  </div>
</template>
```

### Q4: 编译后手动调整被覆盖

**可能原因**：未将文件加入`exclude`列表
**解决方案**：
更新`vureact.config.js`，将调整过的文件加入排除列表。

## 最佳实践

### 1. 路由配置规范

- 导出路由器实例：`export default createRouter({})`
- 使用命名路由：`{ name: 'dashboard', path: '/dashboard', ... }`
- 配置路由懒加载：

  ```tsx
  const Dashboard = lazy(() => import('../pages/Dashboard'));
  ```

- 统一管理路由meta字段

### 2. 文件管理策略

- 路由配置文件单独目录管理
- 类型定义分离到`src/router/types.ts`
- 路由守卫统一在`src/router/guards.ts`

### 3. 测试策略

- 单元测试路由配置
- E2E测试路由跳转流程
- 编译前后功能对比测试

## 相关资源

- [VuReact 官方文档](https://vureact.top)
- [VuReact Router 官方文档](https://router.vureact.top)
- [编译问题反馈与支持](https://github.com/vureact-js/core/issues)
- [路由问题反馈与支持](https://github.com/vureact-js/vureact-router/issues)
