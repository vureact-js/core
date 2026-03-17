# 路由配置说明（需人工处理）

当你的 Vue 项目使用了 Vue Router，编译器会自动完成以下工作：

- 向输出的 `package.json` 注入 `@vureact/router`
- 转换 `<router-link>` / `<router-view>` 及相关 API
- 生成可运行的 React 代码

但 **路由配置文件** 和 **入口挂载方式** 仍需要人工调整。请在输出工程（如 `react-app` / `dist` 目录）按以下步骤处理：

## 1. 检查依赖

`@vureact/router` 会自动注入，无需手动添加。

## 2. 更新入口文件（`src/main.tsx`）

入口仅保留路由提供器，不需要渲染 `<App />`，因为 `App` 应该在路由配置中挂载。

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

## 3. 将路由配置改为 JSX/TSX

路由配置需要允许 JSX 语法，因此建议将文件改为 `.tsx`/`.jsx`。

处理要点：

- 将 `src/router/index.ts` 改为 `src/router/index.tsx`（或 `.jsx`）
- 导出 `createRouter` 路由器实例
- 路由组件以 React 组件方式导入
- 将如 `component: Foo` 改为 `component: <Foo />`
- `App` 作为根路由组件放入路由树（如有布局）

示例：

```tsx
import { createRouter, createWebHashHistory } from '@vureact/router';
import App from '../App';
import Dashboard from '../pages/Dashboard';
import Foo from '../pages/Foo';

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      component: <App />,
      children: [
        { path: 'dashboard', component: <Dashboard /> },
        { path: 'foo', component: <Foo /> },
      ],
    },
  ],
});

export default router;
```

## 4. 检查布局与路由视图

- `App` 中应包含布局，并使用 `<RouterView />` 作为页面渲染出口。
- 如果使用了路由守卫或自定义 `meta` 字段，请确认运行时行为符合预期。

## 5. 保护已调整的文件

> 警告：若不进行此项，将导致页面崩溃。因为从 Vue 路由配置文件迁移过来的 `.ts` / `.js` 文件无法直接在 React 中运行。

在首次编译后，将 Vue 路由配置文件及根组件 `<App />` 加入 `vureact.config.js` 的 `exclude` 排除项。这可以避免后续重新编译时覆盖已调整好的路由配置。若后续需要修改这些文件，需**手动同步**变更。

示例：

```js
export default defineConfig({
  exclude: ['src/main.ts', 'src/App.vue', 'src/router/**'],
});
```

## 6. 启动项目

```bash
npm install
npm run dev
```

当编译器检测到路由使用时，会自动把这份说明文档复制到输出目录根部。
