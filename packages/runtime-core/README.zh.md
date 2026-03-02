# @vureact/runtime-core

**Vue 3 内置组件 / React 钩子 / 模板指令工具集 的 React 适配层**

一套全面的 React 适配层，将 Vue 3 的强大特性赋能至 React 应用中。通过内置组件、响应式钩子和模板指令工具，让你的 React 项目拥有 Vue 风格的开发体验。

## 简介

`@vureact/runtime-core` 是 Vue 3 与 React 之间的桥梁，让 React 开发者无需脱离 React 技术生态，就能直接复用 Vue 优秀的内置组件（KeepAlive、Transition、Teleport）、响应式 API 以及模板指令范式。

本库使用 [Valtio](https://github.com/pmndrs/valtio) 作为响应式引擎，提供高性能的 Proxy-based 响应式系统。

## 说明

### 1. **组件复用性**

- 在 React 中使用 Vue 经过实战验证的内置组件
- 快速实现组件缓存（KeepAlive）、动画过渡（Transition）、端口渲染（Teleport）等复杂 UI 模式

### 2. **开发体验**

- 在 React 中享受 Vue 直观的响应式编程模型
- 使用熟悉的 Vue 风格 API，如 `useReactive`、`useWatch` 以及生命周期钩子
- 借助模板指令工具（`vCls`、`vStyle`、`vOn`）编写更简洁的 JSX 代码

### 3. **迁移与集成**

- 轻松将 Vue 组件迁移至 React 技术栈
- 在已有 React 应用中无缝融入 Vue 开发范式
- 降低 Vue 开发者上手 React 项目的学习成本

## 核心特性

- ✅ **Vue 内置组件**：`<KeepAlive>`、`<Transition>`、`<Teleport>`、`<Suspense>` 等
- ✅ **响应式钩子**：`useReactive`、`useWatch`、`useVRef`、`useComputed` 和生命周期钩子等
- ✅ **指令工具集**：`vCls`、`vStyle`、`vOn`、`vKeyless` 等，还原 Vue 风格模板语法
- ✅ **完备 TypeScript 支持**：全量类型定义，兼容智能提示（IntelliSense）
- ✅ **轻量无冗余**：依赖极简，打包体积经过优化
- ✅ **适配 React 18+**：为现代 React 应用量身打造

## 适用场景

- **需要 Vue 组件范式的 React 项目**
- **团队成员兼具 Vue/React 技术背景**
- **需实现组件缓存（KeepAlive）的应用**
- **需要高级过渡动画效果的项目**
- **从 Vue 迁移至 React 且希望保留原有开发范式的场景**

## 快速上手

### 安装

更多详细教程请访问 [vureact-runtime](https://vureact-runtime.vercel.app)。

```bash
npm i @vureact/runtime-core
```

```bash
pnpm add @vureact/runtime-core
```

```bash
yarn add @vureact/runtime-core
```

### 简易示例

```tsx
import { KeepAlive, useVRef, useWatch } from '@vureact/runtime-core';

function App() {
  const count = useVRef(0);

  useWatch(count, (newVal, oldVal) => {
    console.log(`计数发生变化：${oldVal} → ${newVal}`);
  });

  return (
    <KeepAlive include={['Counter']} max={5}>
      <Counter value={count.value} onIncrement={() => count.value++} />
    </KeepAlive>
  );
}

function Counter(props: { value: number; onIncrement: () => any }) {
  return (
    <>
      <p>当前计数：{props.value}</p>
      <button onClick={props.onIncrement}>增加</button>
    </>
  );
}
```

## 🔗 链接

- [GitHub 仓库](https://github.com/vureact-js/core)
- [npm 包](https://www.npmjs.com/package/@vureact/runtime-core)
- [文档](https://vureact-runtime.vercel.app)
- [问题跟踪](https://github.com/vureact-js/core/issues)
- [贡献指南](../../CONTRIBUTING.zh.md)

## 📄 许可证

MIT © [Ryan John](./LICENSE)
