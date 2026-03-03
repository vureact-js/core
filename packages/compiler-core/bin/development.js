#!/usr/bin/env node

import path from 'path';
const { register } = await import('tsx/esm/api');
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const tsconfig = path.resolve(__dirname, '../tsconfig.json');

// 在开发入口显式传入 compiler-core 自身 tsconfig。
register({ tsconfig });
await import('../src/cli/index.ts');
