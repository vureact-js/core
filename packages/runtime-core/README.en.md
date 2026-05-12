# @vureact/runtime-core

**Bring Vue-style runtime capabilities to React.**

`@vureact/runtime-core` is the **runtime adaptation package** of [VuReact](https://vureact.top/en/).  
It provides Vue-style **reactive APIs, built-in component adaptations, and template directive utilities** for React applications. It is useful both for progressive migration and for teams that want to keep part of the Vue development experience inside React.

[![Npm](https://img.shields.io/npm/v/@vureact/runtime-core.svg?style=flat-square)](https://www.npmjs.com/package/@vureact/runtime-core)
[![Downloads](https://img.shields.io/npm/dt/@vureact/runtime-core?label=Downloads&style=flat-square)](https://www.npmjs.com/package/@vureact/runtime-core)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/vureact-js/core/blob/main/LICENSE)
[![React >=18](https://img.shields.io/badge/React->=18-61dafb)](https://reactjs.org/)

English | [简体中文](./README.md)

## Who this package is for

- React developers who want Vue-style reactive APIs
- Projects that need `KeepAlive`, `Transition`, `Teleport`, and similar Vue-style capabilities
- Teams using `@vureact/compiler-core` and needing the runtime adaptation layer
- Vue-to-React migration efforts that want to preserve part of the original authoring model

## What this package is not

- It is not the Vue compiler; for source transformation, use [@vureact/compiler-core](https://www.npmjs.com/package/@vureact/compiler-core)
- It is not a direct port of the official Vue runtime into React
- It is not a full compatibility layer for all Vue ecosystem libraries

## Installation

```bash
npm install @vureact/runtime-core
```

You can also use:

```bash
pnpm add @vureact/runtime-core
yarn add @vureact/runtime-core
```

`react` and `react-dom` should satisfy `>=18.2.0`.

## What this package provides

### 1. Reactive hooks

Common APIs include:

- `useVRef`
- `useReactive`
- `useComputed`
- `useWatch`
- `useWatchEffect`

Example:

```tsx
import { useVRef, useWatch } from '@vureact/runtime-core';

function Counter() {
  const count = useVRef(0);

  useWatch(count, (newVal, oldVal) => {
    console.log(oldVal, '->', newVal);
  });

  return <button onClick={() => count.value++}>{count.value}</button>;
}
```

### 2. Vue built-in component adaptations

Common components include:

- `KeepAlive`
- `Transition`
- `Teleport`
- `Suspense`

Example:

```tsx
import { KeepAlive } from '@vureact/runtime-core';

function App() {
  return (
    <KeepAlive include={['UserPanel']} max={5}>
      <UserPanel />
    </KeepAlive>
  );
}
```

### 3. Template directive utilities

You can use Vue-style helpers in JSX, such as:

- `vCls`
- `vStyle`
- `vOn`
- `vKeyless`

Their goal is not to replicate Vue template syntax exactly, but to make some high-frequency patterns more ergonomic in React JSX.

## When you would install it directly

There are two common cases:

1. You are using `@vureact/compiler-core` and need to run the compiled output
2. You are not using the compiler, but still want Vue-style runtime capabilities in a React project

In short, `compiler-core` handles compilation, while `runtime-core` handles runtime adaptation.

## Common entry points

Default entry:

```ts
import { useVRef, useWatch, KeepAlive } from '@vureact/runtime-core';
```

Category-based exports are also available:

- `@vureact/runtime-core/adapter-hooks`
- `@vureact/runtime-core/adapter-components`
- `@vureact/runtime-core/adapter-utils`

These are useful when you want imports grouped by capability.

## Technical note

The reactive implementation in this package is built on top of [valtio](https://github.com/pmndrs/valtio), which provides Proxy-based reactivity.

## Related packages

- [@vureact/compiler-core](https://vureact.top/en/) - Vue-to-React compiler and CLI
- [@vureact/router](https://router.vureact.top/en/) - Vue Router to React Router adaptation

## Documentation

- [Runtime docs home](https://runtime.vureact.top/en/)
- [Hooks guide](https://runtime.vureact.top/en/guide/hooks/)
- [Built-in components guide](https://runtime.vureact.top/en/guide/components/)
- [API docs](https://runtime.vureact.top/en/api/)

## Repository and license

- GitHub: <https://github.com/vureact-js/core>
- Docs: <https://runtime.vureact.top/en>

MIT License © 2025 Ruihong Zhong (Ryan John)
