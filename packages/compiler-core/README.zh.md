<div align="center">

# @vureact/compiler-core

中文 | [English](./README.md)

**这是一个将 Vue 3 SFC 编译为 React 18+ 可运行代码的生产级编译器框架。**

</div>

## 关于 VuReact 编译器

### 🎯 核心目标

专门编译 Vue 3 的单文件组件（SFC）。

核心转换基于 `<script setup>` 语法。不支持 Vue 2。

### 📜 必要的编程规则

为了给编译器提供明确的静态分析依据，我们定义了一组简明的 Vue 范式规则，确保转换的精准与可控，

这些规则并非新发明，而是在 Vue 现有编程范式内的必要约定，您无需担心过多额外的心智负担。

### ℹ️ 使用前请注意

如果您计划转换现有的 Vue 3 SFC，请确保其遵循上述规则。完整规则与详细说明，请访问[官方文档](https://vureact.vercel.app)。

## 快速上手

更多详细教程请访问[官方文档](https://vureact.vercel.app)！

### 安装

#### npm

```bash
npm i @vureact/compiler-core -D
```

#### pnpm

```bash
pnpm add @vureact/compiler-core -D
```

#### yarn

```bash
yarn add @vureact/compiler-core -D
```

### 运行编译

> 当编译开始时，vureact 会自动寻找根目录的 `src` 作为入口，批量编译所有 `.vue` 文件，并拷贝所有附属资产文件，最终输出至根目录下的 `.vureact/dist/src`，且保持与源 `src` 相同的结构。

方式1：在你的 Vue3 项目根目录下，直接通过终端运行 npx 命令：

```bash
npx vureact
```

方式2：在 package.json 中添加脚本：

```json
{
  "scripts": {
    "vureact": "vureact -w"
  }
}
```

运行 npm 命令：

```bash
npm run vureact
```

命令行选项 `-w` 表示启用实时增量编译与热更新。（更多选项请查阅在线文档）

## 编译示例

简单的 Vue SFC 模板片段：

**Demo.vue**

```html
<template>
  <div class="container" v-if="visible">
    <slot name="header" title="Hello VuReact!"></slot>
    <slot :msg="1"></slot>
    {{ $$props.foo + $$props.bar }}
    <button @click="count++">{{ count }}</button>
  </div>
</template>

<script setup lang="ts">
  // @vr-name: Demo （注：此注释放在顶部任意位置，用于定义组件名供编译器使用）
  import { ref } from 'vue';

  // 或使用 Vue 的 defineOptions 定义组件名
  defineOptions({ name: 'Demo' });

  // 使用编译器约定的变量名 $$props 接收 defineProps
  const $$props = defineProps(['foo', 'bar']);

  const count = ref(0);
  const visible = ref<boolean>(true);
</script>

<style scoped>
  .container {
    padding: 8px;
    border-radius: 4px;
  }
</style>
```

编译器输出（示例）：

**Demo.tsx**

```tsx
import { ReactNode, useCallback } from 'react';
import { useState$ } from '@vureact/runtime'; // 小型运行时适配包
import './demo-1a2c4ece.css'; // 自动分割 <style> 且 scoped 会生成唯一 id（示例）

// 自动推导生成组件的 props 接口
export type TypeCardProps = { foo?: any; bar?: any } & {
  header?: (props: { title: string }) => ReactNode;
  children?: (props: { count: number }) => ReactNode;
};

export default function Demo($$props: TypeCardProps) {
  const [count, setCount] = useState$(0);
  const [visible, setVisible] = useState$<boolean>(true);

  return visible ? (
    <div className="container" data-css-1a2c4ece>
      {$$props.header?.({ title: 'Hello VuReact!' })}
      {$$props.children?.({ msg: 1 })}
      {$$props.foo + $$props.bar}
      <button
        data-css-1a2c4ece
        onClick={() => {
          setCount(() => count + 1);
        }}
      >
        {count}
      </button>
    </div>
  ) : null;
}
```

带有 `$$` 前缀的命名均为编译器内部生成，以防止和现有命名冲突，你可以根据实际情况手动修改。

## 贡献指南

[CONTRIBUTING](./CONTRIBUTING.zh.md)

## Issues

[Issues](https://gitee.com/vureact-js/core/issues)

## 许可

[MIT](./LICENSE)

Copyright (c) 2025-present, Ruihong Zhong (Ryan John)
