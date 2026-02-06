<div align="center">

# @vureact/runtime-core

中文 | [English](./README.md)

**Vue 3 内置组件的 React 适配器 | React Hooks | 模板指令工具**

[官方文档](https://vureact-runtime.vercel.app)

[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/Node-%E2%89%A518.2.0-green.svg)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-%E2%89%A518.2.0-61dafb.svg)](https://react.dev)

</div>

## 项目介绍

VuReact Runtime Core 是 Vue 3 内置组件（KeepAlive、Transition、Teleport 等）的 React 适配层，让你可以在 React 中使用 Vue 风格的 API 和组件。

### 核心功能亮点

- ✅ **Vue 风格组件**：在 React 中使用 `<KeepAlive>`、`<Transition>`、`<Teleport>` 等 Vue 组件
- ✅ **兼容层 Hooks**：提供 `useState$`、`useWatch`、`useReadonly` 等
- ✅ **指令工具**：内置 `vCls`、`vStyle`、`vOn` 等模板指令的 React 实现
- ✅ **轻量级**：零外部依赖，仅依赖 React 核心库
- ✅ **TypeScript 支持**：完整的类型定义，开箱即用

### 技术栈总览

| 类别   | 技术选型        |
| ------ | --------------- |
| 语言   | TypeScript 5.9+ |
| 运行时 | React 18.2.0+   |
| 构建   | Rollup          |
| 包管理 | pnpm 8+         |
| 测试   | Jest 30+bash    |

## 必需环境

Node.js >= 18.2.0

pnpm >= 8.0.0

## 安装

### npm

```bash
npm i @vureact/runtime-core
```

### pnpm

```bash
pnpm add @vureact/runtime-core
```

### yarn

```bash
yarn add @vureact/runtime-core
```

## 使用示例

```tsx
import React, { memo } from 'react';
import { KeepAlive, useState$, useWatch } from '@vureact/runtime-core';

// 1. 使用 useState$（内部会根据值类型自动选择 useImmer/useState）
function Counter() {
  const [count, setCount] = useState$(0);
  const [num, setNum] = useState$(2);

  // 同时监听两个源
  useWatch([count, num], (val, oldVal) => {
    console.log(`Count changed: ${oldVal} -> ${val}`);
  });

  const onClick = () => {
    setCount(count + 1);
    setNum(num + 1);
  };

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={onClick}>+1</button>
    </div>
  );
}

// 2. 使用 KeepAlive 缓存组件
function Parent() {
  const [visible, setVisible] = useState$(true);

  return (
    <div>
      <button onClick={() => setVisible(!visible)}>Toggle</button>

      {visible && (
        <KeepAlive include={['cached']} max={10}>
          <CachedComponent />
        </KeepAlive>
      )}
    </div>
  );
}

// 3. 使用 Transition 过渡动画
import { Transition } from '@vureact/runtime-core';

function App() {
  const [show, setShow] = useState$(false);

  return (
    <div>
      <button onClick={() => setShow(!show)}>Toggle Modal</button>

      <Transition name="fade" mode="out-in">
        {show && <Modal />}
      </Transition>
    </div>
  );
}
```

## 项目结构

```tree
packages/runtime-core/
├── src/
│   ├── index.ts              # 主入口，统一导出
│   ├── adapter-components/   # Vue 组件适配器
│   │   ├── Component.tsx     # 动态组件
│   │   ├── ContextProvider/  # 上下文提供者
│   │   ├── KeepAlive/        # 缓存组件
│   │   ├── Suspense.tsx      # 异步加载
│   │   ├── Teleport.tsx     # 传送门
│   │   └── Transition/      # 过渡动画
│   ├── adapter-hooks/        # React Hooks 适配
│   │   ├── effect/          # 监听相关 (useWatch, useWatchEffect)
│   │   ├── lifecycle/       # 生命周期 (useMounted, useBeforeUnmount)
│   │   └── state/           # 状态 (useState$, useReadonly)
│   └── adapter-utils/       # 指令工具函数
│       ├── vCls.ts          # 类名处理
│       ├── vStyle.ts        # 样式处理
│       ├── vOn.ts           # 事件处理
│       └── nextTick.ts      # 下一帧
├── dist/                     # 构建产物
└── package.json
```

### 核心目录说明

| 目录                  | 职责                                                                 |
| --------------------- | -------------------------------------------------------------------- |
| `adapter-components/` | 将 Vue 3 内置组件（KeepAlive、Transition 等）封装为 React 可用的组件 |
| `adapter-hooks/`      | 提供 Vue 风格的生命周期和响应式 Hooks                                |
| `adapter-utils/`      | 封装 Vue 指令（v-bind、v-on 等）的 React 实现                        |

## 核心功能与模块

### 适配组件（Adapter Components）

| 组件                | 功能     | 使用场景                    |
| ------------------- | -------- | --------------------------- |
| `<Component>`       | 动态组件 | 根据条件渲染不同组件        |
| `<KeepAlive>`       | 缓存组件 | 保持组件状态，避免重复渲染  |
| `<Suspense>`        | 异步加载 | 配合异步组件使用            |
| `<Teleport>`        | 传送门   | 将子节点渲染到其他 DOM 节点 |
| `<Transition>`      | 过渡动画 | 单元素/组件的进入/离开动画  |
| `<TransitionGroup>` | 列表过渡 | 多个元素的tsx               |

### 状态管理

```js
const [state, setState] = useState$(initialValue);
const readonlyState = useReadonly(state);
const shallowReadonly = useShallowReadonly(state);
```

#### 监听器

```tsx
// 监听值变化
useWatch(source, callback, options); // 监听单个源
useWatchEffect(fn, deps); // 副作用监听
useWatchPostEffect(fn, deps); // post 模式监听
useWatchSyncEffect(fn, deps); // sync 模式监听
```

#### 生命周期

```tsx
useBeforeMount(fn); // 挂载前
useBeforeUpdate(fn); // 更新前
useMounted(fn); // 挂载后
useUpdated(fn); // 更新后
useBeforeUnMount(fn); // 卸载前
useUnmounted(fn); // 卸载后
```

### 指令工具（Directive Utils）

| 函数         | 功能                                      |
| ------------ | ----------------------------------------- |
| `vCls()`     | 处理动态 class，类似于 Vue 的 `:class`    |
| `vStyle()`   | 处理动态 style，类似于 Vue 的 `:style`    |
| `vOn()`      | 处理事件绑定，类似于 Vue 的 `@click`      |
| `vKeyless()` | 处理无键动态绑定，类似于 Vue 的 `:v-bind` |
| `nextTick()` | 等待下一帧/微任务完成                     |

## 注意事项

### 常见问题与解决方案（简略）

#### Q1: `useState$` 和 React `useState` 有什么区别？

**A:** `useState$` 根据初始值的类型**智能选择** `useState`（处理原始值）或 `useImmer`（处理复杂对象），支持通过 Draft 模式进行可变式更新。

1.原始值更新

```tsx
// 原始值 → useState
const [count, setCount] = useState$(0);
setCount(count + 1);
setCount((prev) => prev + 1); // 传入回调更改，必需返回新值
```

2.复杂对象更新

```tsx
// 复杂对象 → useImmer
const [user, updateUser] = useState$({
  name: 'Alice',
  info: { age: 30, city: 'London' },
});
// 通过 draft 直接修改嵌套属性（无需手动展开）
updateUser((draft) => {
  draft.info.city = 'Paris'; // ✅ 直接赋值
  draft.info.age = 31; // ✅ 修改深层属性
  draft.tags.push('developer'); // ✅ 数组变异
  return draft; // ✅ 返回新值
});
```

#### Q2: KeepAlive 组件不生效？

**A:** 确保满足以下条件：

1. 子组件有唯一的 `key` 属性
2. 被 `<KeepAlive>` 直接包裹
3. 使用 `include`/`exclude` 时模式匹配正确

#### Q3: Transition 组件自定义 CSS 过渡为什么不生效？

按照下方的注释，在合适的位置添加过渡效果

```css
.fade-enter-from,
.fade-leave-to {
  opacity: 0; /* 初始过渡外观 */
}
.fade-enter-active {
  opacity: 1; /* 激活时的过渡外观 */
  transition: opacity 0.5s ease;
}
.fade-leave-active {
  opacity: 0; /* 离开时的过渡外观 */
  transition: opacity 0.5s ease;
}
```

### 其他重要说明

- ⚠️ **React 版本要求**：必须使用 React 18.2.0 及以上版本
- ⚠️ **严格模式**：在 React 严格模式下，某些生命周期行为可能略有不同
- 💡 **性能提示**：大量使用 KeepAlive 时，建议设置 `max` 属性限制缓存数量
- 🔗 **完整文档**：更多高级用法或寻找正确用法请访问 [官方文档](https://vureact-runtime.vercel.app)

## 贡献指南

[CONTRIBUTING](./CONTRIBUTING.zh.md)

## Issues

[Issues](https://gitee.com/vureact-js/core/issues)

## 许可

[MIT](./LICENSE)

Copyright (c) 2025-present, Ruihong Zhong (Ryan John)
