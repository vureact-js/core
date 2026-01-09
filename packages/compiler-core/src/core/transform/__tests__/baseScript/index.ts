import { createCompilationCtx } from '@compiler/context';
import { parse } from '@core/parse';
import { transform } from '@core/transform';
import { getDirname } from '@shared/path';
import { readFileSync } from 'fs';
import path from 'path';

export function transformBaseScript() {
  const __dirname = getDirname(import.meta.url);
  const content = readFileSync(path.resolve(__dirname, './index.vue'), 'utf-8');

  const ctx = createCompilationCtx();
  ctx.init({ filename: './index.vue', source: content });

  console.time('\nBase script transform duration');

  const ast = parse(content, ctx.data);
  const result = transform(ast, ctx.data);

  console.timeEnd('\nBase script transform duration');

  console.log('\n=============== Compilation context data: ===============\n');
  console.log(ctx.data.scriptData);
  // console.log(result.script);
}
