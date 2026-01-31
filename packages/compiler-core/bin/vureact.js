#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isDevEnv = fs.existsSync(path.join(__dirname, '../src'));

if (isDevEnv) {
  import('./development.js');
} else {
  import('./production.js');
}
