import { parse } from '@core/parse';
import { transform } from '@core/transform';
import { getDirname } from '@shared/path';
import { readFileSync } from 'fs';
import path from 'path';

export function transformBaseScript() {
  const __dirname = getDirname(import.meta.url);
  const content = readFileSync(path.resolve(__dirname, './index.vue'), 'utf-8');

  console.time('transform script duration');

  const ast = parse(content);
  const result = transform(ast);

  console.timeEnd('transform script duration');

  console.log(result.script);
}
