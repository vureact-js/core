import { defineConfig } from '../../src';

export default defineConfig({
  input: 'src',
  exclude: ['src/main.ts', '**/src/main.ts', 'src/shared/**', '**/src/shared/**'],
  output: {
    workspace: '.vureact',
    outDir: 'react-app',
    bootstrapVite: false,
  },
  format: {
    enabled: false,
    formatter: 'prettier',
  },
  preprocessStyles: true,
});
