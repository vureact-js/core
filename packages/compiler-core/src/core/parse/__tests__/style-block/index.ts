import { createCompilationCtx } from '@compiler/context';
import { parse } from '@parse/index';
import { logger } from '@shared/logger';
import { getDirname } from '@shared/path';
import { readFileSync } from 'fs';
import path from 'path';

function testStyleBlock() {
  const __dirname = getDirname(import.meta.url);
  const content = readFileSync(path.resolve(__dirname, './index.vue'), 'utf-8');

  const ctx = createCompilationCtx();
  ctx.init({ filename: './index.vue', source: content, preprocessStyles: true });

  console.time('[testStyleBlock]: parse duration');

  const ast = parse(content, ctx.data);

  console.timeEnd('[testStyleBlock]: parse duration');

  console.log('\n======================== Less Style Content ========================: \n');
  console.log(ast.style?.source?.content);

  logger.printAll();
}

testStyleBlock();
