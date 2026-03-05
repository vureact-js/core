# @vureact/compiler-core

## What is VuReact?

[VuReact](http://vureact.top) (pronounced /vjuːˈriːækt/) is an intelligent compilation toolchain for Vue 3 → React migration.

It is not a simple syntax conversion, but **semantic-level compilation**: it understands the intent of Vue code and generates code that adheres to React best practices. It consists of two parts: **compile-time transformation** + **runtime adaptation**.

The core strategy is **"convention over configuration"** — through clear compilation conventions, it ensures stable and reliable conversion, making it especially suitable for **progressive migration** scenarios.

## Quick Start

This section will guide you through creating, compiling, and running your first VuReact project; alternatively, you can check out the [online examples first](https://codesandbox.io/p/sandbox/examples-f5rlpk).

After completion, you will clearly understand three things:

1. Under what conventions input SFCs can be stably converted
2. What the compiled directory structure looks like
3. The semantic correspondence between the output TSX and the original SFC
4. The compiler automatically analyzes and appends dependencies, eliminating the need to manually manage React hooks dependencies

## Step 0: Prepare the Directory

First, set up a minimal project (illustration):

```txt
my-app/
├─ src/
│  ├─ components/
│  │  └─ Counter.vue
│  ├─ main.ts
│  └─ index.css
├─ package.json
└─ vureact.config.js
```

## Step 1: Installation

Install the VuReact compiler in your Vue project:

```bash
# Using npm
npm install -D @vureact/compiler-core

# Using yarn
yarn add -D @vureact/compiler-core

# Using pnpm
pnpm add -D @vureact/compiler-core
```

## Step 2: Write the Input SFC

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

## Step 3: Configure the Compiler

`vureact.config.js`

```js
import { defineConfig } from '@vureact/compiler-core';

export default defineConfig({
  input: 'src',
  // Key: Exclude Vue entry files to avoid entry semantic conflicts
  exclude: ['src/main.ts'],
  output: {
    workspace: '.vureact',
    outDir: 'dist',
    // Disable environment initialization for tutorial scenarios to observe pure compilation output
    bootstrapVite: false,
  },
  format: {
    enabled: true, // Enable formatting (this will increase compilation time).
    formatter: 'prettier',
  },
});
```

## Step 4: Execute Compilation

### Method 1: Use the npx command

Run in the root directory:

```bash
npx vureact build
```

### Method 2: Use npm scripts

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

## Step 5: View the Output Directory Tree

Compiled directory (illustration):

```txt
my-app/
├─ .vureact/
│  ├─ cache/
│  │  └─ _metadata.json
│  └─ dist/
│     └─ src/
│        └─ components/
│           ├─ Counter.tsx
│           └─ Counter-<hash>.css
├─ src/
│  └─ ...
└─ vureact.config.js
```

## Step 6: Compare the Generated Results

Below is a typical formatted output (slightly simplified for illustration; the actual hash and property names are subject to local output):

```ts
import { memo, useCallback, useMemo } from 'react';
import { useComputed, useVRef } from '@vureact/runtime-core';
import './Counter-a1b2c3.css';

// Derived from defineProps and defineEmits
type ICounterType = {
  title?: string
  onChange: () => void;
  onUpdate: (value: number) => number;
}

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

## Common Failure Points

- Failure to exclude Vue entry files (e.g., `src/main.ts` or `App.vue`)
- Calling APIs that are converted to Hooks outside the top level
- Unanalyzable expressions appearing in templates (triggering warnings)
- Disabling style preprocessing while using `scoped`, leading to scoping failure

## Ecosystem Integration

- **[Vue Core Adaptation Package](https://runtime.vureact.top/)**: Provides React versions of Vue's common built-in components, core Composition API, etc.
- **[Vue Router Adaptation Package](https://router.vureact.top/)**: Supports conversion from Vue Router 4.x to React Router DOM 7.9+.

If necessary, you can choose [☣️ Mixed Coding](https://vureact.top/guide/mind-control-readme.html) to directly use the React ecosystem.

## 🔗 Links

- GitHub: <https://github.com/vureact-js/core>
- Gitee: <https://gitee.com/vureact-js/core>
- Documentation: [https://vureact.top](https://vureact.top/)
- npm: <https://www.npmjs.com/package/@vureact/compiler-core>
- Online Examples: <https://codesandbox.io/p/devbox/compiler-examples-n8yg68>
