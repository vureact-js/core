// @ts-nocheck

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from '../../src/config';

export default defineConfig({
  exclude: ['src/main.ts'],
  router: {
    configFile: 'src/router/index.ts',
  },
  onSuccess: async () => {
    /*
        对 main.tsx 注入缺失的 styles/app.css 导入
       */
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const entryFile = path.resolve(__dirname, './.vureact/react-app/src/main.tsx');

    const data = fs.readFileSync(entryFile, 'utf-8');
    const newData = data.replace('index.css', 'styles/app.css');

    fs.writeFileSync(entryFile, newData, 'utf-8');
  },
});
