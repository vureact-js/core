import { defineConfig } from '../src';

export default defineConfig({
  input: 'src',
  exclude: ['src/main.ts'], // 排除 Vue 入口文件，这很重要
  cache: true,
  output: {
    workspace: '.vureact',
    bootstrapVite: true,
    outDir: 'dist',
    ignoreAssets: ['public/demo.svg', 'vureact.config.js'],
  },
});
