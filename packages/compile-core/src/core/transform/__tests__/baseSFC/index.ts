import { parse } from '@core/parse';
import { transform } from '@core/transform';
import { getDirname } from '@shared/path';
import { readFileSync } from 'fs';
import path from 'path';

export function transformBaseSFC() {
  const __dirname = getDirname(import.meta.url);
  const content = readFileSync(path.resolve(__dirname, './index.vue'), 'utf-8');

  console.time('transform template duration');

  const ast = parse(content);
  const result = transform(ast);

  console.timeEnd('transform template duration');

  // console.log(JSON.stringify(result.template?.children, null, 2));
}
