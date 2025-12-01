import { getDirname } from '@shared/path';
import { readFileSync } from 'fs';
import path from 'path';
import { parse } from '../../';

export function parseBaseSFC() {
  const __dirname = getDirname(import.meta.url);
  const content = readFileSync(path.resolve(__dirname, './index.vue'), 'utf-8');
  const ast = parse(content);
  console.log('parse result:');
  console.log('');
  console.log(ast);
}
