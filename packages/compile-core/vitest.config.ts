import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true, // 允许直接用 describe/test/expect
    environment: 'node', // Node 环境测试
    include: [
      "__tests__/**/*.test.ts",
      "src/**/__tests__/**/*.test.ts",
    ],
  },
  resolve: {
    alias: {
      "@src": "src",
      "@core": "src/core",
      "@utils": "utils",
      "@shared": "shared",
      "@consts": "consts"
    },
  },
});
