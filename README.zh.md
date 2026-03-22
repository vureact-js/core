<div align="center"><a name="readme-top"></a>

<img height="180" src="./logo.png" />

# VuReact

一个面向语义级代码迁移的智能 Vue 3 转 React 18+ 编译工具链

[![npm version](https://img.shields.io/npm/v/@vureact/compiler-core.svg?style=flat-square)](https://vureact.top/)
[![npm downloads](https://img.shields.io/npm/dm/@vureact/compiler-core.svg?style=flat-square)](https://www.npmjs.com/package/@vureact/compiler-core)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Vue 3](https://img.shields.io/badge/Vue-3.x-42b883)](https://vuejs.org/)
[![React 18+](https://img.shields.io/badge/React-18%2B-61dafb)](https://reactjs.org/)

简体中文 | [English](./README.md)

</div>

---

## 🎯 核心理念

VuReact 不是简单的语法转换工具，而是一个**基于约定的智能编译平台**。我们遵循"可控性优先于全覆盖"的原则，通过明确的编译约定，为 Vue 到 React 的迁移提供**可预测、可分析、可维护**的工程路径。

另外，VuReact **不仅适用于迁移场景**，也适用于那些希望**享受 Vue 优秀的心智模型**，同时**产出 React 代码**的开发场景。

## ✨ 核心特性

- ⚖️ 可控渐进式：支持从单个组件到整个项目的渐进迁移路径，规避爆炸式转换带来的技术债务和系统风险。

- 🧭 约定驱动：基于明确的语法约定而非启发式规则进行编译，确保转换行为的确定性、可分析性和可维护性。

- 🌀 跨框架编译桥：探索性的混合编译模式，允许 Vue 和 React 代码在编译层面共存，编译器作为桥梁连接两个生态，负责处理框架间的语法差异。

- 🏆 概念验证（实验性）：验证"Vue 到 React 完整编译"这一长期技术设想的可行性，通过创新的编译架构和运行时适配，实现前所未有的转换深度和工程完整性。

- 🔄 现代 Vue 语法优先：完整支持 Vue 3 script setup 语法与组合式 API，包括 watch、defineProps、defineEmits 等。

- 📋 模板到 JSX 智能转换：将 Vue 模板语法和指令等，智能转换为符合 React 习惯的 JSX 代码，保持逻辑清晰且符合 React 最佳实践。

- ⚛️ Vue 核心特性适配：将响应式系统、生命周期、内置组件（Transition/KeepAlive）等核心特性完整适配到 React，保持开发心智模型一致。

- 🎨 零运行时样式方案：在编译阶段完全处理 SFC 的 scoped 和 module 样式，以及 Less 和 Sass，生成静态 CSS 文件，解决运行时样式性能开销。

- 🔬 细致的处理：从 import 路径修正到类型定义生成，从代码格式化到依赖分析，每一个编译细节都经过精心设计和优化。

- 📝 TypeScript 无缝迁移：完整保留 TS 类型定义，自动推导并生成对应的 React 组件类型接口，支持 .vue 到 .tsx 的无缝类型转换。

- ⚡ CLI 与实时编译：提供 build/watch 双模式 CLI，支持增量编译与文件监听，开发体验流畅。

- 📁 完整工程化：不仅仅是代码转换，而是完整的项目编译：保持目录、生成文件、拷贝资源、管理依赖。

- 🛠️ Vite 环境集成：可选集成 Vite 官方脚手架，自动初始化标准 React 项目结构与配置。

## 📦 快速开始

查看详细的使用指南和 API 文档请移步 [VuReact 官网](https://vureact.top)！

### 安装

```bash
npm install -D @vureact/compiler-core
# 或
yarn add -D @vureact/compiler-core
# 或
pnpm add -D @vureact/compiler-core
```

### 基础配置

创建 `vureact.config.js`：

```javascript
import { defineConfig } from '@vureact/compiler-core';

export default defineConfig({
  input: 'src',
  cache: true,
  exclude: ['src/main.ts'], // 排除 Vue 入口文件
  output: {
    workspace: '.vureact',
    outDir: 'react-app',
    bootstrapVite: true,
  },
});
```

实际上，除了 `exclude` 需要手动指定外，其他选项均采用示例配置中的默认值，无需额外配置。

### 运行编译

```bash
# 一次性编译
npx vureact build

# 监听模式（开发推荐）
npx vureact watch
```

## 🎨 转换示例

### Vue 3 组件 (输入)

```html
<template>
  <div :class="$style['hello-container']">
    <h1>{{ greetingMessage }}</h1>
    <p>计数器: {{ count }}</p>
    <button @click="increment">点击我增加计数</button>
  </div>
</template>

<script setup lang="ts">
  import { computed, onMounted, ref } from 'vue';

  const count = ref<number>(0);
  const name = ref('Vue 3');

  const greetingMessage = computed(() => {
    return `你好，欢迎来到 ${name.value} 的世界!`;
  });

  const increment = () => {
    count.value++;
  };

  onMounted(() => {
    console.log('组件已挂载！');
  });
</script>

<style module scoped>
  .hello-container {
    padding: 20px;
    border: 1px solid #42b883;
    border-radius: 8px;
  }
</style>
```

### React 组件 (输出)

```tsx
import { useCallback, memo } from 'react';
import { useComputed, useMounted, useVRef } from '@vureact/runtime-core';
import $style from './counter-159e8f98.module.css';

const Counter = memo(() => {
  const count = useVRef<number>(0);
  const name = useVRef('Vue 3');

  const greetingMessage = useComputed(() => {
    return `你好，欢迎来到 ${name.value} 的世界!`;
  });

  const increment = useCallback(() => {
    count.value++;
  }, [count.value]);

  useMounted(() => {
    console.log('组件已挂载！');
  });

  return (
    <div className={$style['hello-container']} data-css-159e8f98>
      <h1 data-css-159e8f98>{greetingMessage.value}</h1>
      <p data-css-159e8f98>计数器: {count.value}</p>
      <button onClick={increment} data-css-159e8f98>
        点击我增加计数
      </button>
    </div>
  );
});

export default Counter;
```

生成的附属 CSS 文件内容：

```css
.hello-container[data-css-159e8f98] {
  padding: 20px;
  border: 1px solid #42b883;
  border-radius: 8px;
}
```

## 📋 编译约定（必读）

为确保转换质量，请遵守以下约定：

### 🗂️ 文件与入口

- 建议只把可控目录纳入 `input`
- 强烈建议把 Vue 入口（如 `src/main.ts`）加入 `exclude`
- 先在小目录验证，再扩大范围

### 📜 Script 约定

- 优先使用 `<script setup>`
- `defineProps/defineEmits/defineSlots/defineOptions` 仅允许顶层使用
- 将被转换为 React Hook 的 `use*` 调用必须位于顶层

### 🎨 Template 约定

- 仅使用已支持指令，未知指令会告警
- `v-else` / `v-else-if` 必须紧邻前一个条件分支

### 🎨 Style 约定

- 仅支持首个 `style` 块，多 `style` 会告警
- `scoped` 与 `module` 支持，但需按规范使用

## 🛠️ CLI 命令

```bash
# 编译项目
npx vureact build

# 监听模式编译
npx vureact watch

# 查看帮助
npx vureact --help
```

## 📁 项目结构

```txt
my-project/
├── src/                    # 原始 Vue 代码
│   ├── components/
│   │   └── Counter.vue
│   └── main.ts
├── .vureact/              # 工作区（生成）
│   ├── react-app/         # 生成的 React 代码
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── Counter.tsx
│   │   │   │   └── counter-[hash].css
│   │   │   └── main.tsx
│   │   └── package.json
│   └── cache/             # 编译缓存
└── vureact.config.js      # 配置文件
```

## 🔗 生态系统

- **[运行时适配包](https://runtime.vureact.top)**：提供 React 版的 Vue 核心 API
- **[路由适配包](https://router.vureact.top)**：支持 Vue Router → React Router 转换
- **[完整文档](https://vureact.top)**：详细的使用指南和 API 文档

## 🎯 适用场景

### ✅ 推荐使用

- **新项目开发**：直接按照 VuReact 约定编写 Vue 风格的组件
- **渐进式迁移**：支持按目录、模块逐步迁移
- **混合开发**：允许 Vue 和 React 组件在项目中并存

### ⚠️ 注意事项

- **实验性工具**：当前版本优先服务于可控工程场景
- **约定驱动**：需要遵守明确的编译约定
- **现代语法**：专注于 Vue 3 Composition API 与 `<script setup>`

## 🔎 仓库子包

- [packages/compiler-core](./packages/compiler-core/)
- [packages/runtime-core](./packages/runtime-core/)

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！请先阅读 [贡献指南](CONTRIBUTING.zh.md)。

## 📄 许可证

MIT License © 2025 [Ruihong Zhong (Ryan John)](./LICENSE)

## 🩷 赞助

**VuReact 的持续发展离不开社区的支持，您的赞助将直接用于项目维护、功能开发和文档完善，帮助我们共同探索 Vue 到 React 编译的技术边界。**

平台：[爱发电](https://afdian.com/a/vureact-js/plan)

---

**VuReact - 验证"Vue 到 React 完整编译"这一长期技术设想的可行性，通过创新的编译架构和运行时适配，实现前所未有的转换深度和工程完整性。**
