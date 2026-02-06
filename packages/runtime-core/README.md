<div align="center">

# @vureact/runtime-core

English | [中文](./README.zh.md)

**React Adapter for Vue 3 Built-in Components | React Hooks | Template Directive Utilities**

[Official Documentation](https://vureact-runtime.vercel.app)

[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/Node-%E2%89%A518.2.0-green.svg)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-%E2%89%A518.2.0-61dafb.svg)](https://react.dev)

</div>
## Project Introduction

VuReact Runtime Core is a React adaptation layer for Vue 3 built-in components (KeepAlive, Transition, Teleport, etc.), enabling you to use Vue-style APIs and components in React.

### Core Feature Highlights

- ✅ **Vue-style Components**: Use `<KeepAlive>`, `<Transition>`, `<Teleport>` and other Vue components in React
- ✅ **Compatible Layer Hooks**: Provide `useState$`, `useWatch`, `useReadonly`, etc.
- ✅ **Directive Utilities**: Built-in React implementations of template directives like `vCls`, `vStyle`, `vOn`
- ✅ **Lightweight**: Zero external dependencies, only relies on the React core library
- ✅ **TypeScript Support**: Complete type definitions out of the box

### Technology Stack Overview

| Category   | Technology Selection       |
| ---------- | -------------------------- |
| Language   | TypeScript 5.9+            |
| Runtime    | React 18.2.0+              |
| Build      | Rollup                     |
| Package Management | pnpm 8+              |
| Testing    | Jest 30+ bash              |

## Required Environment

Node.js >= 18.2.0

pnpm >= 8.0.0

## Installation

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

## Usage Examples

```tsx
import React, { memo } from 'react';
import { KeepAlive, useState$, useWatch } from '@vureact/runtime-core';

// 1. Use useState$ (automatically selects useImmer/useState based on value type internally)
function Counter() {
  const [count, setCount] = useState$(0);
  const [num, setNum] = useState$(2);

  // Watch two sources simultaneously
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

// 2. Use KeepAlive to cache components
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

// 3. Use Transition for animation effects
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

## Project Structure

```tree
packages/runtime-core/
├── src/
│   ├── index.ts              # Main entry, unified export
│   ├── adapter-components/   # Vue component adapters
│   │   ├── Component.tsx     # Dynamic component
│   │   ├── ContextProvider/  # Context provider
│   │   ├── KeepAlive/        # Cache component
│   │   ├── Suspense.tsx      # Async loading
│   │   ├── Teleport.tsx      # Portal
│   │   └── Transition/       # Transition animation
│   ├── adapter-hooks/        # React Hooks adaptation
│   │   ├── effect/           # Watch-related (useWatch, useWatchEffect)
│   │   ├── lifecycle/        # Lifecycle (useMounted, useBeforeUnmount)
│   │   └── state/            # State (useState$, useReadonly)
│   └── adapter-utils/        # Directive utility functions
│       ├── vCls.ts           # Class name handling
│       ├── vStyle.ts         # Style handling
│       ├── vOn.ts            # Event handling
│       └── nextTick.ts       # Next tick
├── dist/                     # Build artifacts
└── package.json
```

### Core Directory Explanation

| Directory            | Responsibility                                                                 |
| -------------------- | ------------------------------------------------------------------------------ |
| `adapter-components/` | Wrap Vue 3 built-in components (KeepAlive, Transition, etc.) into React-usable components |
| `adapter-hooks/`      | Provide Vue-style lifecycle and reactive Hooks                                 |
| `adapter-utils/`      | Encapsulate React implementations of Vue directives (v-bind, v-on, etc.)       |

## Core Features & Modules

### Adapter Components

| Component           | Function               | Usage Scenario                          |
| ------------------- | ---------------------- | --------------------------------------- |
| `<Component>`       | Dynamic component      | Render different components based on conditions |
| `<KeepAlive>`       | Cache component        | Preserve component state and avoid re-rendering |
| `<Suspense>`        | Async loading          | Use with async components               |
| `<Teleport>`        | Portal                 | Render child nodes to other DOM nodes   |
| `<Transition>`      | Transition animation   | Enter/leave animations for single elements/components |
| `<TransitionGroup>` | List transition        | For multiple elements in tsx            |

### State Management

```js
const [state, setState] = useState$(initialValue);
const readonlyState = useReadonly(state);
const shallowReadonly = useShallowReadonly(state);
```

#### Watchers

```tsx
// Watch for value changes
useWatch(source, callback, options); // Watch a single source
useWatchEffect(fn, deps); // Side effect watching
useWatchPostEffect(fn, deps); // Post mode watching
useWatchSyncEffect(fn, deps); // Sync mode watching
```

#### Lifecycle

```tsx
useBeforeMount(fn); // Before mount
useBeforeUpdate(fn); // Before update
useMounted(fn); // After mount
useUpdated(fn); // After update
useBeforeUnMount(fn); // Before unmount
useUnmounted(fn); // After unmount
```

### Directive Utils

| Function     | Function                                  |
| ------------ | ----------------------------------------- |
| `vCls()`     | Handle dynamic class, similar to Vue's `:class` |
| `vStyle()`   | Handle dynamic style, similar to Vue's `:style` |
| `vOn()`      | Handle event binding, similar to Vue's `@click` |
| `vKeyless()` | Handle keyless dynamic binding, similar to Vue's `:v-bind` |
| `nextTick()` | Wait for next frame/microtask completion  |

## Notes

### Common Issues & Solutions (Brief)

#### Q1: What's the difference between `useState$` and React `useState`?

**A:** `useState$` **intelligently selects** `useState` (for primitive values) or `useImmer` (for complex objects) based on the type of the initial value, and supports mutable updates via Draft mode.

1. Primitive value update

```tsx
// Primitive value → useState
const [count, setCount] = useState$(0);
setCount(count + 1);
setCount((prev) => prev + 1); // Pass callback to modify, must return new value
```

2. Complex object update

```tsx
// Complex object → useImmer
const [user, updateUser] = useState$({
  name: 'Alice',
  info: { age: 30, city: 'London' },
});
// Directly modify nested properties via draft (no need to manually spread)
updateUser((draft) => {
  draft.info.city = 'Paris'; // ✅ Direct assignment
  draft.info.age = 31; // ✅ Modify deep properties
  draft.tags.push('developer'); // ✅ Array mutation
  return draft; // ✅ Return new value
});
```

#### Q2: KeepAlive component not working?

**A:** Ensure the following conditions are met:

1. The child component has a unique `key` attribute
2. It is directly wrapped by `<KeepAlive>`
3. Pattern matching is correct when using `include`/`exclude`

#### Q3: Why is the custom CSS transition for the Transition component not working?

Add transition effects in the appropriate place as commented below

```css
.fade-enter-from,
.fade-leave-to {
  opacity: 0; /* Initial transition appearance */
}
.fade-enter-active {
  opacity: 1; /* Transition appearance when active */
  transition: opacity 0.5s ease;
}
.fade-leave-active {
  opacity: 0; /* Transition appearance when leaving */
  transition: opacity 0.5s ease;
}
```

### Other Important Notes

- ⚠️ **React Version Requirement**: React 18.2.0 or higher must be used
- ⚠️ **Strict Mode**: Some lifecycle behaviors may be slightly different in React Strict Mode
- 💡 **Performance Tip**: When using KeepAlive extensively, it is recommended to set the `max` attribute to limit the number of cached items
- 🔗 **Complete Documentation**: For more advanced usage or to find the correct usage, please visit [Official Documentation](https://vureact-runtime.vercel.app)

## Contribution Guide

[CONTRIBUTING](./CONTRIBUTING.md)

## Issues

[Issues](https://gitee.com/vureact-js/core/issues)

## License

[MIT](./LICENSE)

Copyright (c) 2025-present, Ruihong Zhong (Ryan John)