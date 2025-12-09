import { generateJsx } from '@core/codegen/jsx';
import { parse } from '@core/parse';
import { transform } from '@core/transform';
import { getDirname } from '@shared/path';
import { readFileSync } from 'fs';
import path from 'path';

export function baseJsx() {
  const __dirname = getDirname(import.meta.url);
  const content = readFileSync(path.resolve(__dirname, './index.vue'), 'utf-8');

  const ast = parse(content);
  const ir = transform(ast);

  generateJsx(ir);
}
