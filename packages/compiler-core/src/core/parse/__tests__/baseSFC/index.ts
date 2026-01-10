import { createCompilationCtx } from '@compiler/context';
import { logger } from '@shared/logger';
import { getDirname } from '@shared/path';
import { readFileSync } from 'fs';
import path from 'path';
import { parse } from '../../';

export function parseBaseSFC() {
  const __dirname = getDirname(import.meta.url);
  const content = readFileSync(path.resolve(__dirname, './index.vue'), 'utf-8');

  const ctx = createCompilationCtx();
  ctx.init({ filename: './index.vue', source: content });

  console.time('parse duration');

  const ast = parse(content, ctx.data);

  console.timeEnd('parse duration');

  console.log('\n=============== Compilation context data: ===============\n');
  console.log(ctx.data);

  console.log('\n======================== SFC AST ========================: \n');
  console.log(ast);

  logger.printAll();
}
