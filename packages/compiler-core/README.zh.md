# @vureact/compiler-core

[![npm version](https://img.shields.io/npm/v/@vureact/compiler-core.svg?style=flat-square)](https://vureact.top/)
[![npm downloads](https://img.shields.io/npm/dm/@vureact/compiler-core.svg?style=flat-square)](https://www.npmjs.com/package/@vureact/compiler-core)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 什么是 VuReact？

[VuReact](http://vureact.top)（发音 `/vjuːˈriːækt/`）是一个面向 Vue 3 → React 的智能编译工具链。

它不是简单的语法转换，而是**语义级编译**：理解 Vue 代码的意图，生成符合 React 最佳实践的代码。由**编译时转换** + **运行时适配**两部分构成。

核心策略是 **“约定优先”** ——通过明确的编译约定，确保转换稳定可靠，尤其适合**渐进式迁移**场景。

## 快速开始

本节将引导你完成第一个 VuReact 项目的创建、编译和运行；或者选择先查看 [在线示例。](https://codesandbox.io/p/sandbox/examples-f5rlpk)

完成后你会明确三件事：

1. 输入 SFC 在什么约定下可稳定转换
2. 编译后目录会长什么样
3. 输出 TSX 与原始 SFC 的语义对应关系
4. 编译器会自动分析并追加依赖，无需手动管理 React hooks 依赖项

## Step 0：准备目录

先准备一个最小工程（示意）：

```txt
my-app/
├─ src/
│  ├─ components/
│  │  └─ Counter.vue
│  ├─ main.ts
│  └─ index.css
├─ package.json
└─ vureact.config.js
```

## Step 1：安装

在你的 Vue 项目中安装 VuReact 编译器：

```bash
# 使用 npm
npm install -D @vureact/compiler-core

# 使用 yarn
yarn add -D @vureact/compiler-core

# 使用 pnpm
pnpm add -D @vureact/compiler-core
```

## Step 2：编写输入 SFC

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

## Step 3：配置编译器

`vureact.config.js`

```js
import { defineConfig } from '@vureact/compiler-core';

export default defineConfig({
  input: 'src',
  // 关键：排除 Vue 入口文件，避免入口语义冲突
  exclude: ['src/main.ts'],
  output: {
    workspace: '.vureact',
    outDir: 'dist',
    // 教程场景关闭环境初始化，便于观察纯编译产物
    bootstrapVite: false,
  },
  format: {
    enabled: true, // 开启格式化，同时这也会增加编译耗时。
    formatter: 'prettier',
  },
});
```

## Step 4：执行编译

### 方式一：使用 npx 命令

在根目录下运行：

```bash
npx vureact build
```

### 方式二：使用 npm scripts

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

## Step 5：查看输出目录树

编译后目录（示意）：

```txt
my-app/
├─ .vureact/
│  ├─ cache/
│  │  └─ _metadata.json
│  └─ dist/
│     └─ src/
│        └─ components/
│           ├─ Counter.tsx
│           └─ Counter-<hash>.css
├─ src/
│  └─ ...
└─ vureact.config.js
```

## Step 6：对照生成结果

下面是一个格式化后的典型输出（为说明做了轻微简化，实际哈希与属性名以本地产物为准）：

```ts
import { memo, useCallback, useMemo } from 'react';
import { useComputed, useVRef } from '@vureact/runtime-core';
import './Counter-a1b2c3.css';

// 根据 defineProps 和 defineEmits 推导
type ICounterType = {
  title?: string
  onChange: () => void;
  onUpdate: (value: number) => number;
}

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

## 关键观察点

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

## 常见失败点

- 没排除 Vue 入口文件，如 `src/main.ts` 或 `App.vue`
- 在非顶层调用会被转换为 Hook 的 API
- 模板里出现不可分析表达式并被告警
- 关闭样式预处理且使用 `scoped`，导致作用域失效

## 生态集成

- **[Vue 核心适配包](https://runtime.vureact.top/)**：提供 React 版的 Vue 常用内置组件、核心 Composition API 等
- **[Vue 路由适配包](https://router.vureact.top/)**：支持 Vue Router 4.x -> React Router DOM 7.9+ 转换

如果确实需要，你可以选择 [☣️混合编写](https://vureact.top/guide/mind-control-readme.html)，以此直接使用 React 生态。

## 🔗 链接

- GitHub：<https://github.com/vureact-js/core>
- Gitee：<https://gitee.com/vureact-js/core>
- 文档：[https://vureact.top](https://vureact.top/)
- npm：<https://www.npmjs.com/package/@vureact/compiler-core>
- 在线示例：<https://codesandbox.io/p/devbox/compiler-examples-n8yg68>
