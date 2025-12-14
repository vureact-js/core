import { generate } from '@babel/generator';
import { generateJsx } from '@core/codegen/jsx';
import { parse } from '@core/parse';
import { transform } from '@core/transform';
import { getDirname } from '@shared/path';
import { readFileSync, writeFileSync } from 'fs';
import path from 'path';

export function builtInComps() {
  const __dirname = getDirname(import.meta.url);
  const content = readFileSync(path.resolve(__dirname, './index.vue'), 'utf-8');

  console.time('generate built-in components duration');

  const ast = parse(content);
  const ir = transform(ast);
  const jsx = generateJsx(ir);

  console.timeEnd('generate built-in components duration');

  if (jsx) {
    writeFileSync(path.resolve(__dirname, './preview.jsx'), generate(jsx).code, 'utf-8');
  }
}
