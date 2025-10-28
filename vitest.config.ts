import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true, // 允许直接用 describe/test/expect
    environment: 'node', // Node 环境测试
    include: ['tests/**/*.test.ts'], // 测试文件路径
  },
  resolve: {
    alias: {
      '@src': '/src',
      '@parse': '/src/parse',
      '@transform': '/src/transform',
      '@generato': '/src/generate',
      '@utils': '/src/utils',
      '@constants': '/src/constants',
    },
  },
});
