import { defineConfig } from '../../src';

export default defineConfig({
  input: 'src',
  exclude: [
    'src/main.ts',
    '**/src/main.ts',
    'src/shared/**',
    '**/src/shared/**',
    // , 'src/App.vue'
  ],
  output: {
    workspace: '.vureact',
    outDir: 'react-app',
    bootstrapVite: true,
  },
  format: {
    enabled: false,
    formatter: 'prettier',
  },
});
