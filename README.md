<div align="center"><a name="readme-top"></a>

<img height="180" src="./logo.png" />

<h1>VuReact</h1>

An intelligent Vue 3 to React 18+ compilation toolchain for semantic-level code migration

[![npm version](https://img.shields.io/npm/v/@vureact/compiler-core.svg?style=flat-square)](https://vureact.top/)
[![npm downloads](https://img.shields.io/npm/dm/@vureact/compiler-core.svg?style=flat-square)](https://www.npmjs.com/package/@vureact/compiler-core)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Vue 3](https://img.shields.io/badge/Vue-3.x-42b883)](https://vuejs.org/)
[![React 18+](https://img.shields.io/badge/React-18%2B-61dafb)](https://reactjs.org/)

English | [简体中文](./README.zh.md)

</div>

---

## 🎯 Core Philosophy

VuReact is not just a simple syntax conversion tool, but a **convention-based intelligent compilation platform**. We adhere to the principle of "controllability over full coverage," providing a **predictable, analyzable, and maintainable** engineering path for Vue to React migration through explicit compilation conventions.

Furthermore, VuReact is not only suitable for migration scenarios but also for development scenarios where developers wish to enjoy **Vue's excellent mental model** while producing **React code**.

---

## ✨ Core Features

⚖️ Progressive Migration

- Migrate from a single component to a full project safely and gradually.

🧭 Convention Driven

- Compilation based on explicit rules, not heuristics.

🌀 Cross-Framework Bridge

- Vue and React coexist through a unified compilation layer.

🏆 Proof of Concept

- Exploring full Vue to React compilation at scale.

🔄 Modern Vue First

- Full support for Vue 3 script setup and Composition API.

📋 Template to JSX

- Transforms Vue templates into idiomatic React JSX.

⚛️ Core Feature Adaptation

- Reactivity and lifecycle adapted seamlessly to React.

🎨 Zero Runtime CSS

- Scoped and module styles compiled to static CSS.

🔬 Fine-Grained Processing

- Carefully optimized at every compilation step.

📝 TypeScript Ready

- Preserves types and converts .vue to .tsx seamlessly.

⚡ CLI & Watch Mode

- Build and incremental compilation support.

📁 Project-Level Build

- Handles files, assets, and dependencies automatically.

🛠️ Vite Integration

- Optional Vite scaffolding for React projects.

---

## 📦 Quick Start

For detailed usage guides and API documentation, please visit the official VuReact website:

👉 [https://vureact.top](https://vureact.top/en)

---

### Installation

```bash
npm install -D @vureact/compiler-core
# or
yarn add -D @vureact/compiler-core
# or
pnpm add -D @vureact/compiler-core
```

---

### Basic Configuration

Create `vureact.config.js`:

```javascript
import { defineConfig } from '@vureact/compiler-core';

export default defineConfig({
  input: 'src',
  cache: true,
  exclude: ['src/main.ts'], // Exclude Vue entry file
  output: {
    workspace: '.vureact',
    outDir: 'react-app',
    bootstrapVite: true,
  },
});
```

In practice, except for `exclude` (which must be specified manually), all other options use the default values shown above and require no additional configuration.

---

### Run Compilation

```bash
# One-time build
npx vureact build

# Watch mode (recommended for development)
npx vureact watch
```

---

## 🎨 Transformation Example

### Vue 3 Component (Input)

```html
<template>
  <div :class="$style['hello-container']">
    <h1>{{ greetingMessage }}</h1>
    <p>Counter: {{ count }}</p>
    <button @click="increment">Click me to increase</button>
  </div>
</template>

<script setup lang="ts">
  import { computed, onMounted, ref } from 'vue';

  const count = ref<number>(0);
  const name = ref('Vue 3');

  const greetingMessage = computed(() => {
    return `Hello, welcome to the world of ${name.value}!`;
  });

  const increment = () => {
    count.value++;
  };

  onMounted(() => {
    console.log('Component mounted!');
  });
</script>

<style module scoped>
  .hello-container {
    padding: 20px;
    border: 1px solid #42b883;
    border-radius: 8px;
  }
</style>
```

---

### React Component (Output)

```tsx
import { useCallback, memo } from 'react';
import { useComputed, useMounted, useVRef } from '@vureact/runtime-core';
import $style from './counter-159e8f98.module.css';

const Counter = memo(() => {
  const count = useVRef<number>(0);
  const name = useVRef('Vue 3');

  const greetingMessage = useComputed(() => {
    return `Hello, welcome to the world of ${name.value}!`;
  });

  const increment = useCallback(() => {
    count.value++;
  }, [count.value]);

  useMounted(() => {
    console.log('Component mounted!');
  });

  return (
    <div className={$style['hello-container']} data-css-159e8f98>
      <h1 data-css-159e8f98>{greetingMessage.value}</h1>
      <p data-css-159e8f98>Counter: {count.value}</p>
      <button onClick={increment} data-css-159e8f98>
        Click me to increase
      </button>
    </div>
  );
});

export default Counter;
```

Generated CSS file:

```css
.hello-container[data-css-159e8f98] {
  padding: 20px;
  border: 1px solid #42b883;
  border-radius: 8px;
}
```

---

## 📋 Compilation Conventions (Important)

To ensure transformation quality, please follow these conventions:

### 🗂️ Files & Entry

- Include only controllable directories in `input`
- Strongly recommend excluding Vue entry files (e.g., `src/main.ts`)
- Validate in small directories before expanding scope

### 📜 Script Conventions

- Prefer `<script setup>`
- `defineProps / defineEmits / defineSlots / defineOptions` must be top-level only
- Any `use*` call that will be converted into React Hooks must remain at the top level

### 🎨 Template Conventions

- Only supported directives should be used; unknown directives will trigger warnings
- `v-else` / `v-else-if` must be adjacent to the previous conditional branch

### 🎨 Style Conventions

- Only the first `<style>` block is supported; multiple blocks will trigger warnings
- `scoped` and `module` are supported but must follow conventions

---

## 🛠️ CLI Commands

```bash
# Build project
npx vureact build

# Watch mode
npx vureact watch

# Show help
npx vureact --help
```

---

## 📁 Project Structure

```txt
my-project/
├── src/                    # Original Vue source code
│   ├── components/
│   │   └── Counter.vue
│   └── main.ts
├── .vureact/               # Workspace (generated)
│   ├── react-app/          # Generated React project
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── Counter.tsx
│   │   │   │   └── counter-[hash].css
│   │   │   └── main.tsx
│   │   └── package.json
│   └── cache/              # Compilation cache
└── vureact.config.js       # Configuration file
```

---

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

---

## 🎯 Use Cases

### ✅ Recommended

- **New Projects**: Write Vue-style components directly following VuReact conventions
- **Progressive Migration**: Migrate by directory or module incrementally
- **Hybrid Development**: Allow Vue and React components to coexist

### ⚠️ Notes

- **Experimental Tool**: Current versions prioritize controllable engineering scenarios
- **Convention-Driven**: Strict compilation conventions must be followed
- **Modern Syntax Focus**: Focused on Vue 3 Composition API and `<script setup>`

---

## 🔎 Repository Sub-Packages

- [@vureact/compiler-core](packages/compiler-core)
- [@vureact/runtime-core](packages/runtime-core)

---

## 🤝 Contributing

Issues and Pull Requests are welcome!
Please read the contribution guide first: [CONTRIBUTING.md](CONTRIBUTING.md)

---

## 📄 License

MIT License © 2025 Ruihong Zhong (Ryan John)

---

## 🩷 Sponsorship

VuReact’s continued development depends on community support.
Your sponsorship directly supports maintenance, feature development, and documentation improvements, helping push the technical boundaries of Vue-to-React compilation.

Platform: [afdian](https://afdian.com/a/vureact-js/plan)

---

**VuReact — Validating the feasibility of full Vue-to-React compilation through innovative compilation architecture and runtime adaptation, achieving unprecedented transformation depth and engineering completeness.**
