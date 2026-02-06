<div align="center">

# VuReact Core

中文 | [English](./README.md)

这是一款专为转换 Vue 3 `<script setup>` 语法而设计的编译器 + 适配库项目。
</div>

## 目录

- 项目简介
- 子包（Packages）
- 仓库结构概览
- 快速上手（开发与构建）
- 常用脚本与示例命令
- 许可

## 项目简介

本仓库为 VuReact 的核心代码库（Core），核心目标：

- 提供 **compiler-core**：将 Vue 3 SFC/模板解析并转换为 React (TSX/JSX) 代码的编译器内核；
- 提供 **runtime-core**：实现 Vue 风格的运行时适配（Hooks、KeepAlive、Transition、Teleport 等组件与工具）。

项目适用场景：将 Vue3 组件批量/单个迁移到 React，且在 React 中使用 Vue 风格 API 或作为跨框架转换工具链的一部分。

### 重要提醒

我们的主要工作是将 Vue 3 的 `<script setup>` 语法高效地转换为 React 代码，因此不支持 Vue 2。

为了使转换过程更可靠，我们依据 Vue 自身的编程范式，约定了一小组清晰的代码规则。这能帮助编译器更好地理解您的代码意图，请您在转换前稍加留意。请放心，这不会引入新的复杂概念。

如果您有现有的 Vue 3 组件需要转换，建议先花一点时间了解这些约定。所有详细规则和背景说明，我们都在[官方文档](https://vureact.vercel.app)中为您准备好了。

## 子包（Packages）

- **@vureact/compiler-core**
  - 官网： [vureact.vercel.app](https://vureact.vercel.app)
  - 位置： [packages/compiler-core](packages/compiler-core)
  - 功能：Vue3 SFC 解析、AST 转换、React 代码生成、CLI（`vureact`）和示例
  - 文档： [README.zh.md](./packages/compiler-core/README.zh.md)
  - 贡献指南： [CONTRIBUTING.zh.md](./packages/compiler-core/CONTRIBUTING.zh.md)

- **@vureact/runtime-core**
  - 官网： [vureact-runtime.vercel.app](https://vureact-runtime.vercel.app)
  - 位置： [packages/compiler-core](packages/runtime-core)
  - 功能：Vue3 内置组件适配（`KeepAlive`/`Transition` 等）、兼容 Hooks（`useState$`/`useWatch` 等）、指令 util（`vCls`/`vStyle`/`vOn`）
  - 文档： [README.zh.md](./packages/runtime-core/README.zh.md)
  - 贡献指南： [CONTRIBUTING.zh.md](./packages/runtime-core/CONTRIBUTING.zh.md)

## 仓库结构概览

简要目录：

```text
core/
├─ packages/
│  ├─ compiler-core/   # 编译器内核
│  └─ runtime-core/    # 运行时核心适配
├─ .github/            # GitHub 模板与 workflow
├─ package.json        # monorepo 脚本定义（便捷命令）
└─ README.md           # 本文件
```

## 快速上手（开发与构建）

要求环境：

- Node.js >= 18（建议 LTS）
- pnpm（推荐）

常用步骤：

```bash
# 克隆仓库并安装依赖
git clone https://github.com/vureact-js/core.git
cd core
pnpm install

# 构建所有目标包（示例）
pnpm -F @vureact/compiler-core build
pnpm -F @vureact/runtime-core build

# 运行 package 内测试
pnpm -F @vureact/compiler-core test
pnpm -F @vureact/runtime-core test
```

本仓库在 `package.json` 中定义了若干便捷脚本（如 `dev:parse`, `dev:transform`, `test:useState$` 等），可在根目录通过 `pnpm run <script>` 使用。

## 常用脚本与示例命令

- 在 compiler-core 中进行快速调试：

```bash
# 进入包目录
cd packages/compiler-core
# 运行示例或 watch 模式（CLI）
npx vureact -w
```

- 在 runtime-core 中运行测试或 link 到本地 demo：

```bash
cd packages/runtime-core
pnpm test:watch
# 或将包 link 到本地示例项目以做集成验证
npm link
# 在目标项目中： npm link @vureact/runtime-core
```

## 许可

[MIT](./LICENSE)

Copyright (c) 2025-present, Ruihong Zhong (Ryan John)
