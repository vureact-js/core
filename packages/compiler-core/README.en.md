# @vureact/compiler-core

**Write in Vue, generate maintainable React.**

`@vureact/compiler-core` is the **CLI and core compiler package** of VuReact.  
It compiles Vue 3 SFC, script, and style files into **pure React 18+ code**, making it suitable for progressive migration and for teams that want to keep Vue authoring conventions while targeting a React app.

It is a **compile-time solution**, not a runtime bridge.

[![Downloads](https://img.shields.io/npm/dt/@vureact/compiler-core?label=Downloads&style=flat-square)](https://www.npmjs.com/package/@vureact/compiler-core)
[![Node](https://img.shields.io/badge/node-%3E%3D19.0.0-green?label=Node)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/vureact-js/core/blob/master/LICENSE)

English | [简体中文](./README.md)

## Who this package is for

- Teams progressively migrating a Vue 3 codebase to React
- Developers who want Vue-style authoring with React output
- Projects that need a config-driven `build/watch` compilation workflow

## Installation

```bash
npm install -D @vureact/compiler-core
```

You can also use:

```bash
pnpm add -D @vureact/compiler-core
yarn add -D @vureact/compiler-core
```

## Minimal setup

Create `vureact.config.ts` in your project root:

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

This means:

- compile the `src` directory
- exclude the Vue entry file to avoid mount conflicts
- output into `.vureact/react-app`
- automatically prepare a runnable Vite React app

If your project uses Vue Router, you will usually also add:

```ts
router: {
  configFile: 'src/router/index.ts',
}
```

## Usage

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

## What you get

By default, VuReact generates:

- `.vureact/cache` for compilation cache
- `.vureact/react-app` for the React app output
- `.tsx` / `.css` files that mirror your source structure

You can then run the generated app directly:

```bash
cd .vureact/react-app
npm install
npm run dev
```

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
