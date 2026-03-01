import { createCompilationCtx } from '@compiler/context';
import { generate, parse, transform } from '@core/index';
import { logger } from '@shared/logger';
import { getDirname } from '@shared/path';
import { readFileSync, writeFileSync } from 'fs';
import path from 'path';

function testSlotFallback() {
  const __dirname = getDirname(import.meta.url);
  const content = readFileSync(path.resolve(__dirname, './index.vue'), 'utf-8');

  const ctx = createCompilationCtx();
  ctx.init({ filename: './index.vue', source: content });

  console.time('testSlotFallback transform duration');
  console.log();

  const ast = parse(content, ctx.data);
  const ir = transform(ast, ctx.data);
  const result = generate(ir, ctx.data);

  console.timeEnd('testSlotFallback transform duration');
  console.log();

  writeFileSync(path.resolve(__dirname, './preview.jsx'), result.code, 'utf-8');

  logger.printAll();
}

testSlotFallback();
