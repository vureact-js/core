import { defineConfig } from '../../src';

export default defineConfig({
  exclude: ['src/main.ts'],
  router: {
    configFile: 'src/router/index.ts',
  },
});
