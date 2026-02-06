<div align="center">

# @vureact/compiler-core

English | [中文](./README.zh.md)

**This is a next-generation compiler framework that compiles Vue 3 syntax into runnable React 18+ code.**

</div>

## Quick Start

> For more detailed documentation, visit [vureact.vercel.app](https://vureact.vercel.app/en)！

### Installation

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

### Usage Example

#### Run Compilation

1. In the root directory of your Vue3 project, directly run the npx command via the terminal:

```bash
npx vureact
```

2. Add a script to package.json:

```json
{
  "scripts": {
    "vureact": "vureact -w"
  }
}
```

Note: The command-line option `-w` is the shorthand for `--watch`, which enables incremental compilation and hot reloading. (For more options, refer to the online documentation)

Run the npm command:

```bash
npm run vureact
```

When compilation starts, vureact will automatically use the `src` directory as the entry point, compile all `.vue` files in batches, copy all auxiliary asset files, and finally output to `.vureact/dist/src` in the root directory, while maintaining the same structure as the source `src` directory.

## Transformation Example

A simple Vue SFC template snippet:

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
  name: 'Card' /* Define component name for compiler usage */,
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

Compiler output (example):

```tsx
// Card.tsx
import { ReactNode, useCallback } from 'react';
import { useState$ } from '@vureact/runtime'; // Lightweight runtime adaptation package
import './card-[hash].css'; // [hash]: Hash ID is automatically generated for scoped styles

// Auto-generated TS type interface
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
      {/* named slots mapping */}
      {__props.footer}
    </div>
  ) : null;
}
```

## Contributing

[CONTRIBUTING](./CONTRIBUTING.md)

## Issues

[Issues](https://gitee.com/vureact-js/core/issues)

## License

[MIT](./LICENSE)

Copyright (c) 2025-present, Ruihong Zhong (Ryan John)
