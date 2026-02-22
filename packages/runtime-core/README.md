# @vureact/runtime-core

**React Adaptation Layer for Vue 3 Built-in Components / React Hooks / Template Directive Toolset**

A comprehensive React adaptation layer that empowers React applications with the powerful features of Vue 3. Leverage built-in components, reactive hooks, and template directive tools to bring Vue-style development experience to your React projects.

## What is it?

`@vureact/runtime-core` serves as a bridge between Vue 3 and React, enabling React developers to directly reuse Vue's well-proven built-in components (KeepAlive, Transition, Teleport), reactive APIs, and template directive paradigms without leaving the React technical ecosystem.

The reactive implementation in this library is developed based on the mature [valtio](https://github.com/pmndrs/valtio) library from the React community.

## What problems does it solve?

### 1. **Component Reusability**

- Utilize Vue's battle-tested built-in components in React
- Rapidly implement complex UI patterns such as component caching (KeepAlive), animation transitions (Transition), and portal rendering (Teleport)

### 2. **Development Experience**

- Enjoy Vue's intuitive reactive programming model in React
- Use familiar Vue-style APIs like `useReactive`, `useWatch`, and lifecycle hooks
- Write more concise JSX code with template directive tools (`vCls`, `vStyle`, `vOn`)

### 3. **Migration & Integration**

- Effortlessly migrate Vue components to the React tech stack
- Seamlessly integrate Vue development paradigms into existing React applications
- Reduce the learning curve for Vue developers to get started with React projects

## Core Features

- ✅ **Vue Built-in Components**: `<KeepAlive>`, `<Transition>`, `<Teleport>`, `<Suspense>`, etc.
- ✅ **Reactive Hooks**: `useReactive`, `useWatch`, `useVRef`, `useComputed`, lifecycle hooks, and more
- ✅ **Directive Toolset**: `vCls`, `vStyle`, `vOn`, `vKeyless`, etc., restoring Vue-style template syntax
- ✅ **Comprehensive TypeScript Support**: Full type definitions, compatible with IntelliSense
- ✅ **Lightweight & Redundancy-Free**: Minimal dependencies with optimized bundle size
- ✅ **React 18+ Compatible**: Tailored for modern React applications

## Applicable Scenarios

- **React projects requiring Vue component paradigms**
- **Teams with both Vue/React technical backgrounds**
- **Applications needing component caching (KeepAlive)**
- **Projects requiring advanced transition animation effects**
- **Scenarios of migrating from Vue to React while retaining the original development paradigm**

## Quick Start

### Installation

```bash
npm i @vureact/runtime-core
```

```bash
pnpm add @vureact/runtime-core
```

```bash
yarn add @vureact/runtime-core
```

### Simple Example

```tsx
import { KeepAlive, useVRef, useWatch } from '@vureact/runtime-core';

function App() {
  const count = useVRef(0);

  useWatch(count, (newVal, oldVal) => {
    console.log(`Count changed: ${oldVal} → ${newVal}`);
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
      <p>Current count: {props.value}</p>
      <button onClick={props.onIncrement}>Increment</button>
    </>
  );
}
```

### Dependencies

- [freeze-mutate](https://github.com/eram/freeze-mutate#readme)
- [klona](https://github.com/lukeed/klona#readme)
- [react-fast-compare](https://github.com/FormidableLabs/react-fast-compare)
- [react-transition-group](https://github.com/reactjs/react-transition-group#readme)
- [valtio](https://github.com/pmndrs/valtio)
