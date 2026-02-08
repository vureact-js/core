<div align="center">

# @vureact/compiler-core

中文 | [English](./README.md)

**这是一个将 Vue 3 语法编译为 React 18+ 可运行代码的下一代编译器框架。**

</div>

## 关于 VuReact 编译器

### 🎯 核心目标

专门编译 Vue 3 的单文件组件（SFC）。

核心转换基于 `<script setup>` 语法。

不支持 Vue 2。

### 📜 必要的编程规则

为了给编译器提供明确的静态分析依据，我们定义了一组简明的 Vue 范式规则。

目的：确保转换的精准与可控。

性质：这些规则并非新发明，而是在 Vue 现有编程范式内的必要约定。

体验：您无需承受过多额外的心智负担。

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

### 使用示例

#### 运行编译

1. 在你的 Vue3 项目根目录下，直接通过终端运行 npx 命令：

```bash
npx vureact
```

2. 在 package.json 中添加脚本：

```json
{
  "scripts": {
    "vureact": "vureact -w"
  }
}
```

注：命令行选项 `-w` 是 `--watch` 的简写，表示开启增量编译与热更新。（更多选项请查阅在线文档）

运行 npm 命令：

```bash
npm run vureact
```

当编译开始，vureact 会自动寻找目录 `src` 作为入口，批量编译所有 `.vue` 文件，并拷贝所有附属资产文件，最终输出至根目录下的 `.vureact/dist/src`，且保持与源 `src` 相同的结构。

## 转换示例

简单的 Vue SFC 模板片段：

```html
<!-- Card.vue -->
<template>
  <div class="card" v-if="visible">
    <button @click="count++">{{ count }}</button>
    <slot name="footer"></slot>
  </div>
</template>

<script setup lang="ts">
// @vr-name: Card （1. 该注释放在最顶部，用于定义组件名，供编译器使用）
import { ref } from 'vue';

// 2. 或者使用 Vue 的 defineOptions 定义组件名，互不冲突
defineOptions({ name: 'Card' });

const count = ref(0);
const visible = ref(true);
</script>

<style scoped>
.card {
  padding: 8px;
  border-radius: 4px;
}
</style>
```

编译器输出（示例）：

```tsx
// Card.tsx
import { ReactNode, useCallback } from 'react';
import { useState$ } from '@vureact/runtime'; // 小型运行时适配包
import './card-[hash].css'; // [hash]: 使用 scoped 会自动生成哈希id

// 自动生成以 'React' 为命名前缀的 TS 类型接口
interface ReactCardProps {
  footer?: ReactNode;
}

export default function Card($props: ReactCardProps) {
  const [count, setCount] = useState$(0);
  const [visible, setVisible] = useState$(true);

  // count++ ->  __on + Count + 事件类型
  const __onCountClick = useCallback(() => {
    setCount((count) => {
      count++;
      return count;
    });
  }, []);

  return visible ? (
    <div className="card" data-css-hashId>
      <button onClick={__onCountClick} data-css-hashId>
        {count}
      </button>
      {/* named slots 映射 */}
      {$props.footer}
    </div>
  ) : null;
}
```

## 贡献指南

[CONTRIBUTING](./CONTRIBUTING.zh.md)

## Issues

[Issues](https://gitee.com/vureact-js/core/issues)

## 许可

[MIT](./LICENSE)

Copyright (c) 2025-present, Ruihong Zhong (Ryan John)
