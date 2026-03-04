# 02-vite-vue3-standard

本示例是标准 `vue-ts` 风格工程，用于验证常规 Vite Vue3 项目的闭环转换。

## 运行

```bash
npm install

# vue 构建
npm run build

# vureact 构建
npm run vr:build

# vureact 监听
npm run vr:watch
```

## 覆盖能力

- `ref/computed` 与基础事件
- 组件 props + 插槽
- 基础样式导入
- Vue 入口排除策略（`src/main.ts`）

## 运行 React App

### Step 1

```bash
# 进入工作区目录
cd .vureact/react-app/

# 安装依赖
pnpm install
```

### Step 2

如果排除了 `src/App.vue` ，则在 `App.tsx` 里手动导入 `components` 目录下任何你想展示的组件即可

```bash
# 运行 react 应用
pnpm run dev
```
