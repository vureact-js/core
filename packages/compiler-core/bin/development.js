#!/usr/bin/env node

const { register } = await import('tsx/esm/api');
register();
await import('../src/cli/index.ts');
