import { defineConfig } from '../../src';

export default defineConfig({
  input: 'src',
  exclude: [
    'src/main.ts',
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
