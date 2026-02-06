# VuReact Core

> The core monorepo for adapting Vue-style APIs/components to React, including compiler and runtime adaptation packages. It aims to convert Vue3 SFC/templates into code runnable in React and provide Vue-style compatible Hooks and components.

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

Application scenarios of the project: Migrating existing Vue3 components to React, using Vue-style APIs in React, or serving as part of a cross-framework conversion toolchain.

## Subpackages (Packages)

- **@vureact/compiler-core**
  - Location: [packages/compiler-core](packages/compiler-core)
  - Features: Vue SFC parsing, AST transformation, React code generation, CLI (`vureact`) and examples
  - Documentation: [README.zh.md](./packages/compiler-core/README.zh.md)
  - Contribution Guide: [CONTRIBUTING.zh.md](./packages/compiler-core/CONTRIBUTING.zh.md)

- **@vureact/runtime-core**
  - Location: [packages/runtime-core](packages/runtime-core)
  - Features: Adaptation of Vue built-in components (`KeepAlive`/`Transition`, etc.), compatible Hooks (`useState$`/`useWatch`, etc.), directive utils (`vCls`/`vStyle`/`vOn`)
  - Documentation: [README.zh.md](./packages/runtime-core/README.zh.md)
  - Contribution Guide: [CONTRIBUTING.zh.md](./packages/runtime-core/CONTRIBUTING.zh.md)

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
