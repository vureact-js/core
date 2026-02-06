<div align="center">

# VuReact Core

English | [中文](./README.zh.md)

This is a compiler + adapter library project specifically designed for converting the Vue 3 `<script setup>` syntax.

</div>

## Table of Contents

- Project Introduction
- Subpackages (Packages)
- Repository Structure Overview
- Quick Start (Development & Build)
- Common Scripts and Example Commands
- License

## Project Introduction

This repository is the core codebase (Core) of VuReact, with the core objectives:

- Provide **compiler-core**: A compiler kernel that parses and converts Vue 3 SFC/templates into React (TSX/JSX) code;
- Provide **runtime-core**: Implement Vue-style runtime adaptations (components and utilities like Hooks, KeepAlive, Transition, Teleport, etc.).

Applicable Scenarios: Batch/individual migration of Vue 3 components to React, with Vue-style APIs used in React, or as part of a cross-framework conversion toolchain.

### Important Note

Our primary focus is on efficiently converting Vue 3's `<script setup>` syntax to React code, and therefore Vue 2 is not supported.

To make the conversion process more reliable, we have established a small set of clear coding rules based on Vue's own programming paradigms. These rules help the compiler better understand your code intent, so please pay slight attention to them before conversion. Rest assured, this will not introduce new complex concepts.

If you have existing Vue 3 components that need conversion, we recommend spending a little time understanding these conventions. All detailed rules and background explanations are available for you in the [official documentation](https://vureact.vercel.app/en).

## Subpackages (Packages)

- **@vureact/compiler-core**
  - Link: [vureact.vercel.app](https://vureact.vercel.app/en)
  - Location: [packages/compiler-core](packages/compiler-core)
  - Features: Vue 3 SFC parsing, AST transformation, React code generation, CLI (`vureact`) and examples
  - Documentation: [README.md](./packages/compiler-core/README.md)
  - Contribution Guide: [CONTRIBUTING.md](./packages/compiler-core/CONTRIBUTING.md)

- **@vureact/runtime-core**
  - Link: [vureact-runtime.vercel.app](https://vureact-runtime.vercel.app/en)
  - Location: [packages/runtime-core](packages/runtime-core)
  - Features: Adaptation of Vue 3 built-in components (`KeepAlive`/`Transition`, etc.), compatible Hooks (`useState$`/`useWatch`, etc.), directive utils (`vCls`/`vStyle`/`vOn`)
  - Documentation: [README.md](./packages/runtime-core/README.md)
  - Contribution Guide: [CONTRIBUTING.md](./packages/runtime-core/CONTRIBUTING.md)

## Repository Structure Overview

Brief directory structure:

```text
core/
├─ packages/
│  ├─ compiler-core/   # Compiler kernel
│  └─ runtime-core/    # Runtime core adaptation
├─ .github/            # GitHub templates & workflows
├─ package.json        # Monorepo script definitions (convenience commands)
└─ README.md           # This file
```

## Quick Start (Development & Build)

Environment requirements:

- Node.js >= 18 (LTS recommended)
- pnpm (recommended)

Common steps:

```bash
# Clone the repository and install dependencies
git clone https://github.com/vureact-js/core.git
cd core
pnpm install

# Build all target packages (example)
pnpm -F @vureact/compiler-core build
pnpm -F @vureact/runtime-core build

# Run tests within the packages
pnpm -F @vureact/compiler-core test
pnpm -F @vureact/runtime-core test
```

This repository defines several convenience scripts (e.g., `dev:parse`, `dev:transform`, `test:useState$`, etc.) in `package.json`, which can be used in the root directory via `pnpm run <script>`.

## Common Scripts and Example Commands

- Quick debugging in compiler-core:

```bash
# Enter the package directory
cd packages/compiler-core
# Run examples or watch mode (CLI)
npx vureact -w
```

- Run tests or link to local demos in runtime-core:

```bash
cd packages/runtime-core
pnpm test:watch
# Or link the package to a local demo project for integration verification
npm link
# In the target project: npm link @vureact/runtime-core
```

## License

[MIT](./LICENSE)

Copyright (c) 2025-present, Ruihong Zhong (Ryan John)
