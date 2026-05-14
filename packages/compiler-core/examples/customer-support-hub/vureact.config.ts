import { defineConfig } from '../../src/config';

export default defineConfig({
  exclude: ['src/main.ts'],
  router: {
    configFile: 'src/router/index.ts',
  },
});
