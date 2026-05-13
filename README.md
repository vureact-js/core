<div align="center"><a name="readme-top"></a>

  <img height="180" src="./assets/logo.png" />

  <h1>VuReact</h1>

**写 Vue，生成可维护的 React。**

> Vue 转 React 编译工具链，将 Vue 3 SFC・Script・Style 完整转为纯 React 18+ 组件（非运行时桥接）
>
> 优先支持 `<script setup>` 覆盖核心全特性，支持渐进式迁移和混合开发

[![Npm](https://img.shields.io/npm/v/@vureact/compiler-core.svg?label=Npm&style=flat-square)](https://vureact.top/)
[![Downloads](https://img.shields.io/npm/dt/@vureact/compiler-core?label=Downloads&style=flat-square&color=red)](https://www.npmjs.com/package/@vureact/compiler-core)
[![Monthly](https://img.shields.io/npm/dm/@vureact/compiler-core?label=Monthly&style=flat-square)](https://www.npmjs.com/package/@vureact/compiler-core)
[![Node](https://img.shields.io/badge/node-%3E%3D19.0.0-green?label=Node)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/vureact-js/core/blob/master/LICENSE)
[![Vue 3](https://img.shields.io/badge/Vue-3.x-42b883)](https://vuejs.org/)
[![React 18+](https://img.shields.io/badge/React-18%2B-61dafb)](https://reactjs.org/)

[在线体验](#️-在线体验无需安装) · [快速开始](#-快速开始) · [CLI 命令](#️-cli-命令) · [适用场景](#-适用场景) · [生态系统](#️-生态系统) · [语义编译对照](https://www.vureact.top/guide/semantic-comparison/overview.html) · [更新日志](https://www.vureact.top/guide/changelog.html)

简体中文 | [English](./README.en.md) | [日本語](./README.ja.md)

  <a href="assets/hero_demo_3MB.mp4" title="观看项目展示视频">
    <img src="assets/vureact_hero_demo.gif" alt="vureact 编译 Vue 到 React 展示动图" width="100%">
  </a>
</div>

---

## 💡 为什么选 VuReact？

其他方案要么是运行时套壳（性能差、调试难），要么是半成品转换（复杂语法就报错）。VuReact 是编译时方案，产物是纯 React 代码，没有 Vue 运行时，支持渐进迁移。

| 其他方案 | VuReact |
|----------|---------|
| 运行时套壳（双框架，性能差，包体大） | 编译时，产物纯 React，可渐进迁移，逐模块编译 |
| 半成品转换（复杂语法报错） | 完整模板指令、Props、插槽、Composition API、scoped 样式、 TS 类型定义等 |
| AI 改写（结果不确定，代码基于猜测，需人工二次审核） | 确定性编译，基于 AST 静态转换，结果可预测、可追溯 |

👉 **深入了解请访问：**[为什么选择 VuReact？—— 不止是语法转换](https://www.vureact.top/guide/why.html)

---

## 🕹️ 在线体验（无需安装）

**30 秒体验 Vue → React 完整编译流程：**

- [客户支持后台（混写示例）](https://codesandbox.io/p/github/vureact-js/example-customer-support-hub/master?import=true)
- [CRM 管理后台（标准示例）](https://codesandbox.io/p/github/vureact-js/example-crm-admin-backend/master)

> 💡 示例均托管至 CodeSandbox，打开后自动运行，请耐心等待一会！

---

## ✨ 核心特性

- **🧠 语义级编译，不是字符替换**：分析模板、`<script setup>`、组合式 API、TS 类型等完整语义，生成符合 React 习惯的代码。
- **🎯 约定优先，可控可维护**：不追求“什么都能转”，基于明确的编译约定，确保转换结果可预测、可分析。
- **📦 渐进迁移**：从单文件到整个项目逐步推进，不需要一次性重写。
- **⚛️ 完整特性适配**：响应式 API、生命周期、内置组件、路由等 Vue 核心特性完整适配到 React；`scoped`/`module` 样式和 Less/Sass 均在编译阶段处理，零运行时开销。
- **⚡ 自动依赖分析**：顶层函数自动注入 `useCallback`，变量声明自动注入 `useMemo`，hooks 依赖自动追踪。
- **🛠️ 双模式 CLI**：`vureact build`（极速增量编译）+ `vureact watch`（文件监听），开发体验接近原生。

---

## 🚀 快速开始

> 💡 **从零开始的官方指南：**[VuReact 快速入门](https://vureact.top/guide/quick-start.html)
>
> 💡 **完整的项目迁移跟练：**[客户支持协同后台（混写）](https://vureact.top/guide/customer-support-hub)

### 安装

在你的 **Vue 3 项目**下，选择任意方式安装：

```bash
npm i -D @vureact/compiler-core
```

### 创建配置文件

在项目根目录下，创建 `vureact.config.ts` 文件：

```ts
import { defineConfig } from '@vureact/compiler-core';
export default defineConfig({
 input: '', // 输入路径，支持单文件或目录
 exclude: ['src/main.ts'], // 排除 Vue 入口文件
 output: {
   workspace: '.vureact',
   outDir: 'react-app',
   bootstrapVite: true,
 },  
});
```

### 1️⃣ 转换单个 Vue 组件

```ts
{
  // 单 SFC 试点，需使用 <script setup>
  input: './src/your-component.vue',
}
```

### 2️⃣ 转换整个项目

```ts
{
  // 支持多级目录递归，输入任意目录即可
  // 注意：所有组件必须使用 <script setup>（否则会报错）
  input: './src', 
}
```

> 💡 注意：如果你的项目使用了 Vue Router，请查看 [路由适配指南](https://vureact.top/guide/router-adaptation.html)。

### 🤖 执行编译转换

```bash
npx vureact build
```

生成的 `.vureact/react-app` 目录里，包含了转换后的组件和相关依赖配置等。

项目结构大致示例：

```txt
vue-project/
├── .vureact/              # 工作区（编译生成）
│   ├── cache/             # 编译缓存
│   ├── react-app/         # 转换后的 React 工程
│   │   ├── src/           # 转换后的 React 代码
│   │   ├── package.json   # React 项目依赖
│   │   ├── vite.config.ts # Vite 配置
│   │
├── src/                   # 原始 Vue 代码
├── package.json           # 原始项目依赖
└── vureact.config.ts      # 配置文件
```

---

## 🛠️ CLI 命令

```bash
# 全量/增量编译
npx vureact build

# 开发模式，监听文件变化自动编译
npx vureact watch

# 查看版本
npx vureact -v

# 查看帮助
npx vureact --help
```

👉 **build/watch 指南详见：**[Build 增量编译](https://www.vureact.top/guide/incremental-compilation.html) | [Watch 监听模式](https://www.vureact.top/guide/watch-mode.html)

---

## 💬 反馈与交流

- 遇到问题？[查看 FAQ](https://vureact.top/guide/faq.html) 或 [提交 Issue](https://github.com/vureact-js/core/issues)
- 使用感受？来 [Discussions](https://github.com/vureact-js/core/discussions) 聊聊
- 想支持我们？点个 ⭐ 让更多人看到这个项目

---

## 🎯 适用场景

### ✅ 推荐使用

- **新项目开发**：直接按照 VuReact 约定编写 Vue 风格的组件
- **渐进式迁移**：支持按目录、模块逐步迁移
- **混合开发**：允许 Vue 和 React 组件在项目中并存

### ⚠️ 注意事项

- **优先可控**：服务于可控工程场景
- **约定驱动**：需要遵守明确的编译约定
- **现代语法**：专注于 Vue 3 Composition API 与 `<script setup>`

---

## 📦 仓库子包

- [packages/compiler-core](./packages/compiler-core/)
- [packages/runtime-core](./packages/runtime-core/)

---

## ♻️ 生态系统

- **[VuReact Runtime](https://runtime.vureact.top)**：提供轻量级 React 版的 Vue 核心组件 & API
- **[VuReact Router](https://router.vureact.top)**：基于 React Router 的 Vue Router 风格适配层

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！请先阅读 [贡献指南](CONTRIBUTING.zh.md)。

---

## 📄 许可证

MIT License © 2025 [Ruihong Zhong (Ryan John)](./LICENSE)

---

## 🩷 赞助

**VuReact 的持续发展离不开社区的支持，您的赞助将直接用于项目维护、功能开发和文档完善，帮助我们共同探索 Vue 到 React 编译的技术边界。**

平台：[爱发电](https://afdian.com/a/vureact-js/plan)

---

## 🧩 谁在用

第一个使用案例正在征集中，如果你试用了 VuReact，欢迎告诉我们！你可以通过 Issue 模板提交案例：

- [提交「谁在用」案例](https://github.com/vureact-js/core/issues/new?template=showcase.zh-CN.md&title=%5BSHOWCASE%5D%20)
- [查看已提交案例](https://github.com/vureact-js/core/issues?q=is%3Aissue%20label%3Ashowcase)

我们会定期从这些案例中整理出适合公开展示的条目，展示到这里。

---

*VuReact - 验证"Vue 到 React 完整编译"这一长期技术设想的可行性，通过创新的编译架构和运行时适配，实现前所未有的转换深度和工程完整性。*
