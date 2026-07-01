# @vureact/compiler-core

`@vureact/compiler-core` 是专为 Vue 迁移 React 设计的智能编译器，也是 VuReact 的 **CLI 与核心编译包**。
它用于将 Vue 3 单文件组件・脚本・样式完整转为纯 React（非运行时桥接）代码并输出工程化产物，覆盖 `<script setup>` 核心全特性，支持渐进式迁移与 Vue+React 混合开发。

[![Npm](https://img.shields.io/npm/v/@vureact/compiler-core.svg?label=Npm&style=flat-square)](https://vureact.top/)
[![Downloads](https://img.shields.io/npm/dt/@vureact/compiler-core?label=Downloads&style=flat-square)](https://www.npmjs.com/package/@vureact/compiler-core)
[![Coverage](https://codecov.io/gh/vureact-js/core/graph/badge.svg?flag=compiler-core&style=flat-square)](https://codecov.io/gh/vureact-js/core)
[![Node](https://img.shields.io/badge/node-%3E%3D20.19.0-green?label=Node)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/vureact-js/core/blob/master/LICENSE)

简体中文 | [English](./README.md)

## 这个包适合谁

- 项目需从 Vue 3 渐进式迁移到 React，但不想从头重写，优先寻找现有解决方案
- 部分开发者以 Vue 为主技术栈，习惯其心智模型，认为 React 的额外负担比 Vue 更重
- 后端开发者不想学习双框架，Vue 上手快、符合直觉，不愿接触 React
- 转换后的 React 需完全脱离 Vue 运行时，避免双框架运行时所带来的性能和体积问题

## 使用方式

> 💡 **从零开始的官方指南：**[VuReact 快速入门](https://vureact.top/guide/quick-start.html)
>
> 💡 **混合项目迁移实践：**[客户支持协同后台（Vue + React）](https://vureact.top/guide/customer-support-hub)

### 1. 安装

```bash
npm install -D @vureact/compiler-core
```

也可以使用：

```bash
pnpm add -D @vureact/compiler-core
yarn add -D @vureact/compiler-core
```

### 2. 创建配置文件

在项目根目录新建 `vureact.config.ts`：

```ts
import { defineConfig } from '@vureact/compiler-core';

export default defineConfig({
  exclude: ['src/main.ts'], // 排除 Vue 入口文件
});
```

如果你只想用默认工作区和输出目录，这样就够了。

如果需要显式指定输出配置，可以写成：

```ts
import { defineConfig } from '@vureact/compiler-core';

export default defineConfig({
  input: './src',
  exclude: ['src/main.ts'],
  output: {
    workspace: '.vureact',
    outDir: 'react-app',
    bootstrapVite: true,
  },
});
```

如果项目使用 Vue Router，通常还会补上：

```ts
router: {
  configFile: 'src/router/index.ts',
}
```

### 3. 先从单文件试点

如果你想先验证一个组件能否稳定转换，可以先只编译单个 SFC：

```ts
export default defineConfig({
  input: './src/your-component.vue',
  exclude: ['src/main.ts'],
});
```

这适合：

- 先验证编译约定
- 先看生成结果
- 先小范围试点，而不是直接全仓推进

### 4. 再扩展到整个项目

当单文件试点通过后，再把 `input` 指向目录：

```ts
export default defineConfig({
  input: './src',
  exclude: ['src/main.ts'],
});
```

这会递归处理目录下的 Vue / Script / Style 文件。

> 注意：VuReact 优先支持基于 `<script setup>` 的现代 Vue 3 写法。  
> 如果你的项目使用 Vue Router，请同时查看 [路由适配指南](https://vureact.top/guide/router-adaptation.html)。

### 5. 执行编译

```bash
# 一次性编译
npx vureact build

# 监听模式
npx vureact watch
```

如果你更喜欢脚本命令，也可以写进 `package.json`：

```json
{
  "scripts": {
    "vr:build": "vureact build",
    "vr:watch": "vureact watch"
  }
}
```

### 6. 查看输出结果

默认情况下，VuReact 会生成：

- `.vureact/cache`：编译缓存
- `.vureact/react-app`：React 工程产物
- 与源目录结构对应的 `.tsx` / `.css` 文件

目录大致如下：

```txt
vue-project/
├── .vureact/
│   ├── cache/
│   ├── react-app/
│   │   ├── src/
│   │   ├── package.json
│   │   ├── vite.config.ts
├── src/
├── package.json
└── vureact.config.ts
```

进入产物目录后可直接运行：

```bash
cd .vureact/react-app
npm install
npm run dev
```

如果你想更系统地了解 build/watch 的差异，可以继续阅读：

- [监听模式](https://vureact.top/guide/watch-mode.html)
- [增量编译](https://vureact.top/guide/incremental-compilation.html)

## 这个包不负责什么

- 它不是 Vue in React / React in Vue 的运行时桥接层
- 它不是对任意 Vue 代码都“零约定”生效的通用 codemod
- 它更适合遵循 VuReact 编译约定的工程化项目

## 相关包

- [@vureact/runtime-core](https://runtime.vureact.top/)：React 版 Vue 运行时适配 API
- [@vureact/router](https://router.vureact.top/)：Vue Router 到 React Router 的适配方案

## 文档入口

- [快速开始](https://vureact.top/guide/quick-start.html)
- [关键配置](https://vureact.top/guide/key-configuration.html)
- [监听模式](https://vureact.top/guide/watch-mode.html)
- [增量编译](https://vureact.top/guide/incremental-compilation.html)
- [渐进式迁移指南](https://vureact.top/guide/progressive-migration.html)
- [配置 API](https://vureact.top/api/config.html)
- [FAQ](https://vureact.top/guide/faq.html)

## 仓库与许可证

- GitHub: <https://github.com/vureact-js/core>
- 文档: <https://vureact.top>

MIT License © 2025 Ruihong Zhong (Ryan John)
