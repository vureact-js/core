# @vureact/compiler-core

**写 Vue，交付生产级 React 代码** —— 让你在 Vue 3 心智下，编译出 React 18+ 应用的编译工具。

[![Npm](https://img.shields.io/npm/v/@vureact/compiler-core.svg?label=Npm&style=flat-square)](https://vureact.top/)
[![Downloads](https://img.shields.io/npm/dt/@vureact/compiler-core?label=Downloads&style=flat-square)](https://www.npmjs.com/package/@vureact/compiler-core)
[![Monthly](https://img.shields.io/npm/dm/@vureact/compiler-core?label=Monthly&style=flat-square)](https://www.npmjs.com/package/@vureact/compiler-core)
[![Node](https://img.shields.io/badge/node-%3E%3D19.0.0-green?label=Node)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Vue 3](https://img.shields.io/badge/Vue-3.x-42b883)](https://vuejs.org/)
[![React 18+](https://img.shields.io/badge/React-18%2B-61dafb)](https://reactjs.org/)

简体中文 | [English](./README.en.md)

## 简介

`@vureact/compiler-core` 是 VuReact 的核心编译包，负责将 Vue 3 单文件组件、脚本文件和样式文件**三位一体**编译为可直接用于生产环境的 React 18+ JSX/TSX 代码。

## 安装

```bash
npm install -D @vureact/compiler-core
```

## 快速开始

👉 **完整教程请访问：[VuReact 官网 - 快速开始](https://vureact.top/guide/introduction.html)**

### 配置示例

`vureact.config.ts`

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

### 编译命令

```bash
npx vureact build      # 编译项目
npx vureact watch      # 监听模式
```

## 生态集成

- **[VuReact Runtime Core](https://runtime.vureact.top/)**：提供 React 版的 Vue 常用内置组件、核心 Composition API 等
- **[VuReact Router](https://router.vureact.top/)**：支持 Vue Router 4.x → React Router DOM 7.9+ 转换

如果确实需要，你可以选择 [☣️混合编写](https://vureact.top/guide/mind-control-readme.html)，以此直接使用 React 生态。

## 常见问题

👉 请查阅[官网 FAQ 章节](https://vureact.top/guide/faq.html)

## 🔗 链接

- GitHub：<https://github.com/vureact-js/core>
- Gitee：<https://gitee.com/vureact-js/core>
- 文档：[https://vureact.top](https://vureact.top/)
