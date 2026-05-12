<div align="center"><a name="readme-top"></a>

  <img height="180" src="./assets/logo.png" />

  <h1>VuReact</h1>

**写 Vue，生成可维护的 React。**

> Vue 转 React 编译工具链，将 Vue 3 SFC・Script・Style 完整转为纯 React 18+ 组件（非运行时桥接），覆盖 `<script setup>` 核心全特性。
>
> Vue 心智模型 + React 生态，产出生产就绪的工程化产物。

[![Npm](https://img.shields.io/npm/v/@vureact/compiler-core.svg?label=Npm&style=flat-square)](https://vureact.top/)
[![Downloads](https://img.shields.io/npm/dt/@vureact/compiler-core?label=Downloads&style=flat-square&color=red)](https://www.npmjs.com/package/@vureact/compiler-core)
[![Monthly](https://img.shields.io/npm/dm/@vureact/compiler-core?label=Monthly&style=flat-square)](https://www.npmjs.com/package/@vureact/compiler-core)
[![Node](https://img.shields.io/badge/node-%3E%3D19.0.0-green?label=Node)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/vureact-js/core/blob/master/LICENSE)
[![Vue 3](https://img.shields.io/badge/Vue-3.x-42b883)](https://vuejs.org/)
[![React 18+](https://img.shields.io/badge/React-18%2B-61dafb)](https://reactjs.org/)

[在线演示](#️-在线演示) · [快速开始](#-快速开始) · [CLI 命令](#️-cli-命令) · [生态系统](#-生态系统) · [语义编译对照](https://www.vureact.top/guide/semantic-comparison/overview.html) · [FAQ](#常见问题) · [更新日志](https://www.vureact.top/guide/changelog.html)

简体中文 | [English](./README.en.md) | [日本語](./README.ja.md)

  <a href="assets/hero_demo_3MB.mp4" title="观看项目展示视频">
    <img src="assets/vureact_hero_demo.gif" alt="vureact 编译 Vue 到 React 展示动图" width="100%">
  </a>
</div>

---

## 💡 为什么选 VuReact？

它不是简单的语法转换工具，采用了一种与**传统迁移工具/运行时桥接**完全不同的工程化思路。如果你正在考虑将 Vue 项目迁移到 React，或者希望在 React 生态中继续使用 Vue 的开发体验，VuReact 提供了一个可控、可预测的解决方案。

| 其他方案 | VuReact |
|----------|---------|
| 运行时套壳（双框架，性能差） | 编译时，产物纯 React |
| 半成品转换（复杂语法报错） | 完整模板指令、Props、插槽、Composition API、scoped 样式、 TS 类型定义等 |
| 依赖人工重写，成本高 | 可渐进迁移，逐模块编译 |

👉 **深入了解请访问：**[为什么选择 VuReact？—— 不止是语法转换](https://www.vureact.top/guide/why.html)

---

## 🕹️ 在线演示

在开始之前，你可以访问我们提供的 CodeSandbox 在线案例，了解 VuReact 将 Vue 编译为 React 项目，再到成功运行页面的完整流程！

- [客户支持协同后台（混写）](https://codesandbox.io/p/github/vureact-js/example-customer-support-hub/master?import=true)
- [客户关系管理后台（标准）](https://codesandbox.io/p/github/vureact-js/example-crm-admin-backend/master)

---

## ✨ 核心亮点

- **🧠 语义级编译，不是字符替换**：分析模板、`<script setup>`、组合式 API、TS 类型等完整语义，生成符合 React 习惯的代码。
- **🎯 约定优先，可控可维护**：不追求“什么都能转”，基于明确的编译约定，确保转换结果可预测、可分析。
- **📦 渐进迁移**：从单文件到整个项目逐步推进，不需要一次性重写。
- **⚛️ 完整特性适配**：响应式 API、生命周期、内置组件、路由等 Vue 核心特性完整适配到 React；`scoped`/`module` 样式和 Less/Sass 均在编译阶段处理，零运行时开销。
- **⚡ 智能依赖分析**：顶层函数自动注入 `useCallback`，变量声明自动注入 `useMemo`，hooks 依赖自动追踪。
- **🛠️ 双模式 CLI**：`vureact build`（极速增量编译）+ `vureact watch`（文件监听），开发体验接近原生。

---

## 📦 快速开始

👉 **完整教程请访问：[VuReact - 快速开始](https://vureact.top/guide/quick-start.html)**

完成后你会明确三件事：

1. 输入 SFC 在什么约定下可稳定转换
2. 编译后目录会长什么样
3. 输出 TSX 与原始 SFC 的语义对应关系
4. 编译器会自动分析并追加依赖，无需手动管理 React hooks 依赖项

### Step 0：准备目录

先准备一个最小工程（示意）：

```txt
my-app/
├─ src/
│  ├─ components/
│  │  └─ Counter.vue
│  ├─ App.vue
│  ├─ main.ts
├─ package.json
├─ tsconfig.json
├─ vite.config.json
└─ vureact.config.ts
```

### Step 1：安装

在你的 Vue 项目中安装 VuReact 编译器：

```bash
# 使用 npm
npm install -D @vureact/compiler-core

# 使用 yarn
yarn add -D @vureact/compiler-core

# 使用 pnpm
pnpm add -D @vureact/compiler-core
```

### Step 2：编写输入 SFC

`src/components/Counter.vue`

```html
<template>
  <section class="counter-card">
    <h2>{{ props.title || title }}</h2>
    <p>Count: {{ count }}</p>
    <button @click="increment">+1</button>
    <button @click="methods.decrease">-1</button>
  </section>
</template>

<script setup lang="ts">
  // @vr-name: Counter （注：用于告诉编译器，该生成什么组件名）
  import { computed, ref } from 'vue';

  // 也可以使用宏定义组件名
  defineOptions({ name: 'Counter' });

  // 定义 props
  const props = defineProps<{ title?: string }>();

  // 定义 emits
  const emits = defineEmits<{
    (e: 'change'): void;
    (e: 'update', value: number): number;
  }>();

  const step = ref(1);
  const count = ref(0);
  const title = computed(() => `Counter x${step.value}`);

  const increment = () => {
    count.value += step.value;
    emits('update', count.value);
  };

  const methods = {
    decrease() {
      count.value -= step.value;
    },
  };
</script>

<style lang="less" scoped>
  @border-color: #ddd;
  @border-radius: 8px;
  @padding-base: 12px;

  .counter-card {
    border: 1px solid @border-color;
    border-radius: @border-radius;
    padding: @padding-base;
  }
</style>
```

### Step 3：配置编译器

`vureact.config.ts`

```ts
import { defineConfig } from '@vureact/compiler-core';

export default defineConfig({
  // 输入路径，包含要编译的 Vue 文件；允许输入单文件 'xxx.vue'
  input: './src',

  // 排除 Vue 入口文件，避免语义冲突
  exclude: ['src/main.ts'],

  output: {
    // 工作区目录，存放编译产物和缓存
    workspace: '.vureact',

    // 输出目录名
    outDir: 'react-app',

    // 自动初始化 Vite React 环境
    bootstrapVite: true,
  },
});
```

如果项目使用 Vue Router，通常还会补上：

```ts
router: {
  // Vue Router 配置入口文件位置，便于注入路由适配代码至 React 产物 
  configFile: 'src/router/index.ts',
}
```

> 实际上，除了 `exclude` 需要手动指定外，其他选项均采用示例配置中的默认值，无需额外配置。

### Step 4：执行编译

#### 方式一：使用 npx 命令

在根目录下运行：

```bash
npx vureact build
```

#### 方式二：使用 npm scripts

在 `package.json` 里添加脚本命令：

```json
"scripts": {
  "watch": "vureact watch",
  "build": "vureact build"
}
```

```bash
npm run build
```

### Step 5：查看输出目录树

编译后目录（示意）：

```txt
my-project/
├── .vureact/              # 工作区（编译生成）
│   ├── cache/             # 编译缓存
│   ├── react-app/         # 生成的 React 代码
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── Counter.tsx
│   │   │   │   └── Counter-[hash].css
│   │   │   └── App.tsx
│   │   │   └── index.css
│   │   │   └── main.tsx
│   │   └── package.json
│   │   └── tsconfig.json
│   │   └── vite.config.ts
│   │   └── ...
│   │
├── src/                   # 原始 Vue 代码
│   ├── components/
│   │   └── Counter.vue
│   └── main.ts            # Vue 入口文件
├── ...
└── vureact.config.ts      # VuReact 配置文件
```

### Step 6：对照生成结果

下面是一个格式化后的典型输出（为说明做了轻微简化，实际哈希与属性名以本地产物为准）：

```tsx
import { memo, useCallback, useMemo } from 'react';
import { useComputed, useVRef } from '@vureact/runtime-core';
import './Counter-a1b2c3.css';

// 根据 defineProps 和 defineEmits 推导
type ICounterType = {
  title?: string;
  onChange: () => void;
  onUpdate: (value: number) => number;
};

// memo 包裹组件
const Counter = memo((props: ICounterType) => {
  // ref/computed 转换成了对等的适配 API
  const step = useVRef(1);
  const count = useVRef(0);
  const title = useComputed(() => `Counter x${step.value}`);

  // 自动分析顶层箭头函数依赖，并追加 useCallback 优化
  const increment = useCallback(() => {
    count.value += step.value;
    props.onUpdate?.(count.value); // emits 转换
  }, [count.value, step.value, props.onUpdate]);

  // 自动分析顶层对象中的依赖，并追加 useMemo 优化
  const methods = useMemo(
    () => ({
      decrease() {
        count.value -= step.value;
      },
    }),
    [count.value, step.value],
  );

  return (
    <>
      <section className="counter-card" data-css-a1b2c3>
        <h2 data-css-a1b2c3>{props.title || title.value}</h2>
        <p data-css-a1b2c3>Count: {count.value}</p>
        <button onClick={increment} data-css-a1b2c3>
          +1
        </button>
        <button onClick={methods.decrease} data-css-a1b2c3>
          -1
        </button>
      </section>
    </>
  );
});

export default Counter;
```

CSS 文件内容：

```css
.counter-card[data-css-a1b2c3] {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 12px;
}
```

### 关键观察点

1. `// @vr-name: Counter` 这段特殊注释定义了组件名
2. `defineProps` 和 `defineEmits` 被转换成了 TS 组件类型
3. 非纯 UI 展示组件，默认会走 `memo` 包装
4. `ref` / `computed` 被转换为 runtime 适配 API（`useVRef` / `useComputed`）
5. 模板事件回调会生成符合 React 语义的 `onClick`
6. 顶层箭头函数自动分析依赖，尝试注入 `useCallback`
7. 顶层变量声明自动分析依赖，尝试注入 `useMemo`
8. 对 JSX 中的原 `ref` 状态值补上 `.value`
9. `less` 样式被编译为 css 代码
10. `scoped` 样式会生成带哈希的 css 文件，并在元素上标注作用域属性

---

## 🛠️ CLI 命令

```bash
# 编译项目
npx vureact build

# 监听模式编译
npx vureact watch

# 查看帮助
npx vureact --help
```

👉 **双模式 CLI 指南请访问：**[Build 增量编译](https://www.vureact.top/guide/incremental-compilation.html) | [Watch 监听模式](https://www.vureact.top/guide/watch-mode.html)

---

## 📋 编译约定（必读）

移步 [VuReact 编译约定](https://vureact.top/guide/specification.html) 查看具体内容！

---

## 常见问题

请移步 [VuReact 常见问题](https://vureact.top/guide/faq.html)！

---

## 🔗 生态系统

- **[运行时适配包](https://runtime.vureact.top)**：提供 React 版的 Vue 核心 API
- **[路由适配包](https://router.vureact.top)**：支持 Vue Router → React Router 转换
- **[完整文档](https://vureact.top)**：详细的使用指南和 API 文档

---

## 🎯 适用场景

### ✅ 推荐使用

- **新项目开发**：直接按照 VuReact 约定编写 Vue 风格的组件
- **渐进式迁移**：支持按目录、模块逐步迁移
- **混合开发**：允许 Vue 和 React 组件在项目中并存

### ⚠️ 注意事项

- **优先可控**：当前版本优先服务于可控工程场景
- **约定驱动**：需要遵守明确的编译约定
- **现代语法**：专注于 Vue 3 Composition API 与 `<script setup>`

---

## 🔎 仓库子包

- [packages/compiler-core](./packages/compiler-core/)
- [packages/runtime-core](./packages/runtime-core/)

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

如果你的团队、产品或实验项目已在使用 VuReact，欢迎告诉我们。此处会优先收录真实项目名称、使用场景、迁移阶段和公开链接，帮助其他用户更快判断 VuReact 是否适合自己的工程场景。

| 项目 | 场景 | 当前阶段 | 链接 |
| --- | --- | --- | --- |
| 等待你的项目加入 | 新项目 / 迁移试点 / 混合栈实践 | 招募中 | [提交使用案例](https://github.com/vureact-js/core/issues/new?template=showcase.zh-CN.md&title=%5BSHOWCASE%5D%20) |

你可以通过 Issue 模板提交案例：

- [提交「谁在用」案例](https://github.com/vureact-js/core/issues/new?template=showcase.zh-CN.md&title=%5BSHOWCASE%5D%20)
- [查看已提交案例](https://github.com/vureact-js/core/issues?q=is%3Aissue%20label%3Ashowcase)

维护者会定期从这些案例中整理出适合公开展示的条目，更新到这里。

---

**VuReact - 验证"Vue 到 React 完整编译"这一长期技术设想的可行性，通过创新的编译架构和运行时适配，实现前所未有的转换深度和工程完整性。**
