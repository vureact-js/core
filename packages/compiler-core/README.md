# @vureact/compiler-core

`@vureact/compiler-core` is a compiler toolchain for migrating from Vue to React — and for writing React with Vue 3 syntax. **CLI and core compiler package** of VuReact.  

It is used to fully convert Vue 3 SFCs, Scripts, and Styles into pure React (non-runtime bridge) code and output engineered artifacts, covering all core features of `<script setup>`, and supporting progressive migration and hybrid development.

[![Downloads](https://img.shields.io/npm/dt/@vureact/compiler-core?label=Downloads&style=flat-square)](https://www.npmjs.com/package/@vureact/compiler-core)
[![Node](https://img.shields.io/badge/node-%3E%3D19.0.0-green?label=Node)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/vureact-js/core/blob/master/LICENSE)

English | [简体中文](./README.zh-CN.md)

## Who this package is for

- Projects need to migrate incrementally from Vue 3 to React, but do not want to rewrite from scratch, preferring to find existing solutions first.
- Some developers use Vue as their primary technology stack, are accustomed to its mental model, and consider React's overhead to be heavier than Vue's.
- Backend developers do not want to learn both frameworks; Vue is quick to pick up and intuitive, and they are reluctant to engage with React.
- The converted React code must completely detach from the Vue runtime to avoid performance and bundle size issues caused by a dual-framework runtime.

## Usage

> 💡 **Official guide from scratch:** [VuReact Quick Start](https://vureact.top/en/guide/quick-start.html)
>
> 💡 **Hybrid migration walkthrough:** [Customer Support Hub (Vue + React)](https://vureact.top/en/guide/customer-support-hub)

### 1. Install

```bash
npm install -D @vureact/compiler-core
```

You can also use:

```bash
pnpm add -D @vureact/compiler-core
yarn add -D @vureact/compiler-core
```

### 2. Create a config file

Create `vureact.config.ts` in your project root:

```ts
import { defineConfig } from '@vureact/compiler-core';

export default defineConfig({
  input: '', // input path: a single file or a directory
  exclude: ['src/main.ts'], // exclude the Vue entry file
});
```

If you are fine with the default workspace and output directory, this is enough.

If you want to make the output settings explicit, you can write:

```ts
import { defineConfig } from '@vureact/compiler-core';

export default defineConfig({
  input: './src',
  exclude: ['src/main.ts'],
  output: {
    workspace: '.vureact',
    outDir: 'react-app',
    bootstrapVite: true,
  },
});
```

If your project uses Vue Router, you will usually also add:

```ts
router: {
  configFile: 'src/router/index.ts',
}
```

### 3. Start with a single-file pilot

If you want to validate the transformation first, start with one SFC:

```ts
export default defineConfig({
  input: './src/your-component.vue',
  exclude: ['src/main.ts'],
});
```

This is useful when you want to:

- validate the compilation conventions first
- inspect the generated output first
- run a small pilot before scaling to the whole codebase

### 4. Expand to the whole project

Once the single-file pilot works, point `input` to a directory:

```ts
export default defineConfig({
  input: './src',
  exclude: ['src/main.ts'],
});
```

This will recursively process Vue, script, and style files under that directory.

> Note: VuReact primarily targets modern Vue 3 codebases built around `<script setup>`.  
> If your project uses Vue Router, also see the [router adaptation guide](https://vureact.top/en/guide/router-adaptation.html).

### 5. Run the compiler

```bash
# one-time build
npx vureact build

# watch mode
npx vureact watch
```

If you prefer scripts, add them to `package.json`:

```json
{
  "scripts": {
    "vr:build": "vureact build",
    "vr:watch": "vureact watch"
  }
}
```

### 6. Check the output

By default, VuReact generates:

- `.vureact/cache` for compilation cache
- `.vureact/react-app` for the React app output
- `.tsx` / `.css` files that mirror your source structure

The project layout typically looks like:

```txt
vue-project/
├── .vureact/
│   ├── cache/
│   ├── react-app/
│   │   ├── src/
│   │   ├── package.json
│   │   ├── vite.config.ts
├── src/
├── package.json
└── vureact.config.ts
```

You can then run the generated app directly:

```bash
cd .vureact/react-app
npm install
npm run dev
```

If you want a deeper explanation of the two modes, continue with:

- [Watch Mode](https://vureact.top/en/guide/watch-mode.html)
- [Incremental Compilation](https://vureact.top/en/guide/incremental-compilation.html)

## What this package is not

- It is not a Vue-in-React / React-in-Vue runtime bridge
- It is not a zero-convention codemod for arbitrary Vue code
- It works best in projects that follow VuReact compilation conventions

## Related packages

- [@vureact/runtime-core](https://runtime.vureact.top/en/) - React-side Vue runtime adaptation APIs
- [@vureact/router](https://router.vureact.top/en/) - Vue Router to React Router adaptation

## Documentation

- [Quick Start](https://vureact.top/en/guide/quick-start.html)
- [Key Configuration](https://vureact.top/en/guide/key-configuration.html)
- [Watch Mode](https://vureact.top/en/guide/watch-mode.html)
- [Incremental Compilation](https://vureact.top/en/guide/incremental-compilation.html)
- [Progressive Migration Guide](https://vureact.top/en/guide/progressive-migration.html)
- [Config API](https://vureact.top/en/api/config.html)
- [FAQ](https://vureact.top/en/guide/faq.html)

## Repository and license

- GitHub: <https://github.com/vureact-js/core>
- Docs: <https://vureact.top/en>

MIT License © 2025 Ruihong Zhong (Ryan John)
