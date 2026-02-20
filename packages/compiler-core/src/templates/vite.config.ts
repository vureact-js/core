import { tsAlias } from '@ruan-cat/vite-plugin-ts-alias';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    react(),
    /*
      tsAlias:
      The plugin will automatically read the `paths` configuration
      from your `tsconfig.json` and convert it into Vite aliases.
     */
    tsAlias(),
  ],
});
