<div align="center">

# @vureact/compiler-core

中文 | [English](./README.md)

**这是一个将 Vue 3 语法编译为 React 18+ 可运行代码的下一代编译器框架。**

</div>

## 快速上手

> 更详细的文档说明尽在 [vureact.vercel.app](https://vureact.vercel.app) ！

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

```vue
<!-- Card.vue -->
<template>
  <div class="card" v-if="visible">
    <button @click="count++">{{ count }}</button>
    <slot name="footer"></slot>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

defineOptions({
  name: 'Card' /* 定义组件名，供编译器使用 */,
});

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

export default function Card(__props: ReactCardProps) {
  const [count, setCount] = useState$(0);
  const [visible, setVisible] = useState$(true);

  // count++
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
      {__props.footer}
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
