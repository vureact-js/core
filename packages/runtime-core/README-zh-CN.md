# @vureact/runtime-core

**把 Vue 风格的运行时能力带到 React。**

`@vureact/runtime-core` 是 [VuReact](https://vureact.top/) 的 **运行时适配包**。  
它为 React 应用提供 Vue 风格的 **响应式 API、内置组件适配、模板指令工具**，适合渐进迁移，也适合希望在 React 中保留部分 Vue 开发体验的项目。

[![Npm](https://img.shields.io/npm/v/@vureact/runtime-core.svg?style=flat-square)](https://www.npmjs.com/package/@vureact/runtime-core)
[![Downloads](https://img.shields.io/npm/dt/@vureact/runtime-core?label=Downloads&style=flat-square)](https://www.npmjs.com/package/@vureact/runtime-core)
[![Coverage](https://codecov.io/gh/vureact-js/core/graph/badge.svg?flag=runtime-core&token=CODECOV_TOKEN)](https://codecov.io/gh/vureact-js/core)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/vureact-js/core/blob/main/LICENSE)
[![React >=18](https://img.shields.io/badge/React->=18-61dafb)](https://reactjs.org/)

简体中文 | [English](./README.en.md)

## 这个包适合谁

- 想在 React 中使用 Vue 风格响应式 API
- 需要 `KeepAlive`、`Transition`、`Teleport` 等 Vue 内置能力
- 正在配合 `@vureact/compiler-core` 使用运行时适配 API
- 正在做 Vue → React 迁移，希望保留一部分原有开发范式

## 这个包不负责什么

- 它不是 Vue 编译器；源码转换请使用 [@vureact/compiler-core](https://www.npmjs.com/package/@vureact/compiler-core)
- 它不是 Vue 官方运行时在 React 中的直接移植
- 它不是对所有 Vue 生态库的完整兼容层

## 安装

```bash
npm install @vureact/runtime-core
```

也可以使用：

```bash
pnpm add @vureact/runtime-core
yarn add @vureact/runtime-core
```

`react` 和 `react-dom` 需要满足 `>=18.2.0`。

## 这个包提供什么

### 1. 响应式 Hooks

常见 API 包括：

- `useVRef`
- `useReactive`
- `useComputed`
- `useWatch`
- `useWatchEffect`

示例：

```tsx
import { useVRef, useWatch } from '@vureact/runtime-core';

function Counter() {
  const count = useVRef(0);

  useWatch(count, (newVal, oldVal) => {
    console.log(oldVal, '->', newVal);
  });

  return <button onClick={() => count.value++}>{count.value}</button>;
}
```

### 2. Vue 内置组件适配

常见组件包括：

- `KeepAlive`
- `Transition`
- `Teleport`
- `Suspense`

示例：

```tsx
import { KeepAlive } from '@vureact/runtime-core';

function App() {
  return (
    <KeepAlive include={['UserPanel']} max={5}>
      <UserPanel />
    </KeepAlive>
  );
}
```

### 3. 模板指令工具

可以在 JSX 中使用一些 Vue 风格辅助工具，例如：

- `vCls`
- `vStyle`
- `vOn`
- `vKeyless`

它们的目标不是复制 Vue 模板语法，而是让某些高频模式在 React JSX 中更顺手。

## 什么时候会单独安装它

有两种常见情况：

1. 你正在使用 `@vureact/compiler-core`，需要运行编译产物
2. 你没有使用编译器，但希望在 React 项目中直接使用 Vue 风格运行时能力

换句话说，`compiler-core` 负责“编译”，`runtime-core` 负责“运行时适配”。

## 常用导出入口

默认入口：

```ts
import { useVRef, useWatch, KeepAlive } from '@vureact/runtime-core';
```

此外也提供分类导出：

- `@vureact/runtime-core/adapter-hooks`
- `@vureact/runtime-core/adapter-components`
- `@vureact/runtime-core/adapter-utils`

适合在你希望按能力分组引用时使用。

## 技术说明

本库的响应式实现基于 [valtio](https://github.com/pmndrs/valtio)，用于提供 Proxy 驱动的响应式能力。

## 相关包

- [@vureact/compiler-core](https://vureact.top/)：Vue 到 React 的编译器与 CLI
- [@vureact/router](https://router.vureact.top/)：Vue Router 到 React Router 的适配方案

## 文档入口

- [Runtime 文档首页](https://runtime.vureact.top/)

## 仓库与许可证

- GitHub: <https://github.com/vureact-js/core>
- 文档: <https://runtime.vureact.top>

MIT License © 2025 Ruihong Zhong (Ryan John)

