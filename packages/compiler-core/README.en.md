# @vureact/compiler-core

**Write in Vue 3, compile to React 18+ code.**

A **Vue-to-React** compiler that **fully compiles** Vue 3 SFC, scripts & styles into **pure React 18+ code** (no runtime bridge), covering core `<script setup>` features.

[![Npm](https://img.shields.io/npm/v/@vureact/compiler-core.svg?label=Npm&style=flat-square)](https://vureact.top/en/)
[![Downloads](https://img.shields.io/npm/dt/@vureact/compiler-core?label=Downloads&style=flat-square)](https://www.npmjs.com/package/@vureact/compiler-core)
[![Monthly](https://img.shields.io/npm/dm/@vureact/compiler-core?label=Monthly&style=flat-square)](https://www.npmjs.com/package/@vureact/compiler-core)
[![Node](https://img.shields.io/badge/node-%3E%3D19.0.0-green?label=Node)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Vue 3](https://img.shields.io/badge/Vue-3.x-42b883)](https://vuejs.org/)
[![React 18+](https://img.shields.io/badge/React-18%2B-61dafb)](https://reactjs.org/)

English | [简体中文](./README.md)

## Introduction

`@vureact/compiler-core` is the core compilation package of VuReact, responsible for compiling Vue 3 SFC, script files, and style files into React 18+ JSX/TSX code ready for production.

## Installation

```bash
npm install -D @vureact/compiler-core
```

## Quick Start

👉 **Full tutorial: [VuReact Website - Quick Start](https://vureact.top/en/guide/quick-start.html)**

### Configuration Example

`vureact.config.ts`

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

### Commands

```bash
npx vureact build      # Build project
npx vureact watch      # Watch mode
```

## Ecosystem

- **[VuReact Runtime Core](https://runtime.vureact.top/en)**: React-compatible implementations of Vue core APIs
- **[VuReact Router](https://router.vureact.top/en)**: Vue Router 4.x → React Router DOM 7.9+ conversion

If necessary, you can choose [☣️ Mixed Coding](https://vureact.top/en/guide/mind-control-readme.html) to directly use the React ecosystem.

## FAQ

👉 [FAQ](https://vureact.top/en/guide/faq.html)

## 🔗 Links

- GitHub: <https://github.com/vureact-js/core>
- Documentation: <https://vureact.top/en>
