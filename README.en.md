<div align="center"><a name="readme-top"></a>

  <img height="180" src="./assets/logo.png" />

  <h1>VuReact</h1>

**Write Vue, Ship Production-Ready React** — Build React 18+ apps with the Vue 3 mental model.

It's more than just a migration tool — it seamlessly blends Vue's excellent development mindset with the power of the React ecosystem, producing **maintainable, evolvable, production-ready** React code.

[![Npm](https://img.shields.io/npm/v/@vureact/compiler-core.svg?label=Npm&style=flat-square)](https://vureact.top/en/)
[![Downloads](https://img.shields.io/npm/dt/@vureact/compiler-core?label=Downloads&style=flat-square)](https://www.npmjs.com/package/@vureact/compiler-core)
[![Monthly](https://img.shields.io/npm/dm/@vureact/compiler-core?label=Monthly&style=flat-square)](https://www.npmjs.com/package/@vureact/compiler-core)
[![Node](https://img.shields.io/badge/node-%3E%3D19.0.0-green?label=Node)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Vue 3](https://img.shields.io/badge/Vue-3.x-42b883)](https://vuejs.org/)
[![React 18+](https://img.shields.io/badge/React-18%2B-61dafb)](https://reactjs.org/)

English | [简体中文](./README.md) | [日本語](./README.ja.md)

[<video autoplay loop muted src="./assets/hero_demo_3MB.mp4"></video>](https://github.com/user-attachments/assets/ae3efac0-9576-42ea-8bbd-8dd5509947a8)

</div>

---

## 🪄 Playground

Before you begin, you can first understand the complete process of how VuReact compiles a Vue project into a React project and successfully runs the page!

- Customer Support Hub (Mixed)：<https://codesandbox.io/p/github/vureact-js/example-customer-support-hub/master?import=true>
- CRM Admin Dashboard (Standard)：<https://codesandbox.io/p/github/vureact-js/example-crm-admin-backend/master>

## 🎯 Core Philosophy

VuReact is not just a simple syntax conversion tool, but a **convention-based intelligent compilation platform**. We adhere to the principle of "controllability over full coverage," providing a **predictable, analyzable, and maintainable** engineering path for Vue to React migration through explicit compilation conventions.

Furthermore, VuReact is not only suitable for migration scenarios but also for development scenarios where developers wish to enjoy **Vue's excellent mental model** while producing **React code**.

## ✨ Core Features

**🧠 Semantic-aware**：Understand Vue 3 like a compiler, generate maintainable React 18+ like a pro

**⚖️ Incremental Migration**：Start small, scale to full projects—no risky rewrites

**🧭 Convention-driven**：Predictable transforms powered by clear conventions, not guesses

**⚛️ Complete Feature Adaptation**：Vue features, fully mapped to React—zero runtime cost

**⚡ Excellent Developer Experience**：Vue mental model, seamless React dev; CLI build/watch, fast incremental compile, native-like

**🌀 Innovative Exploration**：A new bridge between Vue and React at compile time

## 📦 Quick Start

👉 **Full tutorial: [VuReact Website - Quick Start](https://vureact.top/en/guide/quick-start.html)**

After completion, you will clearly understand three things:

1. Under what conventions input SFCs can be stably converted
2. What the compiled directory structure looks like
3. The semantic correspondence between the output TSX and the original SFC
4. The compiler automatically analyzes and appends dependencies, eliminating the need to manually manage React hooks dependencies

### Step 0: Prepare the Directory

First, set up a minimal project (illustration):

```txt
my-app/
├─ src/
│  ├─ components/
│  │  └─ Counter.vue
│  ├─ App.vue
│  ├─ main.ts
│  └─ index.css
├─ package.json
├─ tsconfig.json
└─ vureact.config.ts
```

### Step 1: Installation

Install the VuReact compiler in your Vue project:

```bash
# Using npm
npm install -D @vureact/compiler-core

# Using yarn
yarn add -D @vureact/compiler-core

# Using pnpm
pnpm add -D @vureact/compiler-core
```

### Step 2: Write the Input SFC

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
  // @vr-name: Counter (Note: Tells the compiler what component name to generate)
  import { computed, ref } from 'vue';

  // You can also use macros to define component names
  defineOptions({ name: 'Counter' });

  // Define props
  const props = defineProps<{ title?: string }>();

  // Define emits
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

### Step 3: Configure the Compiler

`vureact.config.ts`

```ts
import { defineConfig } from '@vureact/compiler-core';

export default defineConfig({
  // Input path containing Vue files to compile; single file 'xxx.vue' is allowed
  input: './src',

  // Exclude Vue entry files to avoid semantic conflicts
  exclude: ['src/main.ts'],

  output: {
    // Workspace directory to store compilation output and cache
    workspace: '.vureact',

    // Output directory name
    outDir: 'react-app',

    // Automatically initialize Vite React environment
    bootstrapVite: true,
  },
});
```

### Step 4: Execute Compilation

#### Method 1: Use the npx command

Run in the root directory:

```bash
npx vureact build
```

#### Method 2: Use npm scripts

Add script commands to `package.json`:

```json
"scripts": {
  "watch": "vureact watch",
  "build": "vureact build"
}
```

```bash
npm run build
```

### Step 5: View the Output Directory Tree

Compiled directory (illustration):

```txt
my-project/
├── .vureact/              # Workspace (generated)
│   ├── cache/             # Compilation cache
│   ├── react-app/         # Generated React code
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── Counter.tsx
│   │   │   │   └── counter-[hash].css
│   │   │   └── App.tsx
│   │   │   └── index.css
│   │   │   └── main.tsx
│   │   └── package.json
│   │   └── tsconfig.json
│   │   └── vite.config.ts
│   │   └── ...
│   │
├── src/                   # Original Vue code
│   ├── components/
│   │   └── Counter.vue
│   └── main.ts            # Vue entry file
├── ...
└── vureact.config.js      # VuReact configuration file
```

### Step 6: Compare the Generated Results

Below is a typical formatted output (slightly simplified for illustration; the actual hash and property names are subject to local output):

```tsx
import { memo, useCallback, useMemo } from 'react';
import { useComputed, useVRef } from '@vureact/runtime-core';
import './Counter-a1b2c3.css';

// Derived from defineProps and defineEmits
type ICounterType = {
  title?: string;
  onChange: () => void;
  onUpdate: (value: number) => number;
};

// Component wrapped with memo
const Counter = memo((props: ICounterType) => {
  // ref/computed converted to equivalent adaptation APIs
  const step = useVRef(1);
  const count = useVRef(0);
  const title = useComputed(() => `Counter x${step.value}`);

  // Automatically analyze dependencies of top-level arrow functions and append useCallback optimization
  const increment = useCallback(() => {
    count.value += step.value;
    props.onUpdate?.(count.value); // emits conversion
  }, [count.value, step.value, props.onUpdate]);

  // Automatically analyze dependencies in top-level objects and append useMemo optimization
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

CSS file content:

```css
.counter-card[data-css-a1b2c3] {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 12px;
}
```

## Key Observations

1. The special comment `// @vr-name: Counter` defines the component name
2. `defineProps` and `defineEmits` are converted to TS component types
3. Non-pure UI display components are wrapped with `memo` by default
4. `ref` / `computed` are converted to runtime adaptation APIs (`useVRef` / `useComputed`)
5. Template event callbacks generate React-semantic `onClick`
6. Top-level arrow functions have their dependencies automatically analyzed and `useCallback` is injected where applicable
7. Top-level variable declarations have their dependencies automatically analyzed and `useMemo` is injected where applicable
8. The `.value` suffix is added to original `ref` state values in JSX
9. Less styles are compiled to CSS code
10. Scoped styles generate hashed CSS files and add scoped attributes to elements

## 📋 Compilation Conventions (Important)

For details, please refer to [VuReact Compilation Conventions](https://vureact.top/en/guide/specification.html).

## 🛠️ CLI Commands

```bash
# Build project
npx vureact build

# Watch mode
npx vureact watch

# Show help
npx vureact --help
```

## FAQ

Please visit [VuReact FAQ](https://vureact.top/en/guide/faq.html)!

## 🔗 Ecosystem

- **Runtime Adapter Package**
  Provides React-compatible implementations of Vue core APIs.
  [https://runtime.vureact.top](https://runtime.vureact.top/en/)

- **Router Adapter Package**
  Supports Vue Router → React Router transformation.
  [https://router.vureact.top](https://router.vureact.top/en/)

- **Full Documentation**
  Detailed usage guides and API references.
  [https://vureact.top](https://vureact.top/en)

## 🎯 Use Cases

### ✅ Recommended

- **New Projects**: Write Vue-style components directly following VuReact conventions
- **Progressive Migration**: Migrate by directory or module incrementally
- **Hybrid Development**: Allow Vue and React components to coexist

### ⚠️ Notes

- **Controllability First**: Current versions prioritize controllable engineering scenarios
- **Convention-Driven**: Strict compilation conventions must be followed
- **Modern Syntax Focus**: Focused on Vue 3 Composition API and `<script setup>`

## 🔎 Repository Sub-Packages

- [@vureact/compiler-core](packages/compiler-core)
- [@vureact/runtime-core](packages/runtime-core)

## 🤝 Contributing

Issues and Pull Requests are welcome!
Please read the contribution guide first: [CONTRIBUTING.md](CONTRIBUTING.md)

## 📄 License

MIT License © 2025 Ruihong Zhong (Ryan John)

## 🩷 Sponsorship

VuReact’s continued development depends on community support.
Your sponsorship directly supports maintenance, feature development, and documentation improvements, helping push the technical boundaries of Vue-to-React compilation.

Platform: [afdian](https://afdian.com/a/vureact-js/plan)

---

**VuReact — Validating the feasibility of full Vue-to-React compilation through innovative compilation architecture and runtime adaptation, achieving unprecedented transformation depth and engineering completeness.**
