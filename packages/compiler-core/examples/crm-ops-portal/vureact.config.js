import { defineConfig } from '../../src';

export default defineConfig({
  input: 'src',
  exclude: ['src/main.ts'],
  output: {
    workspace: '.vureact',
    outDir: 'react-app',
    bootstrapVite: true,
  },
  format: {
    enabled: false,
    formatter: 'prettier',
  },
  router: {
    // 路由入口文件（createRouter的地方）
    entry: 'src/router/index.ts',
    // 路由定义文件
    routeDefinitions: ['src/router/routes.ts'],
  },
});
