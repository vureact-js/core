import { generate } from '@codegen/index';
import { createCompilationCtx } from '@compiler/context';
import { parseSFC } from '@parse/index';
import { logger } from '@shared/logger';
import { getDirname } from '@shared/path';
import { transform } from '@transform/index';
import { readFileSync, writeFileSync } from 'fs';
import path from 'path';

function testDefineExpose() {
  const __dirname = getDirname(import.meta.url);
  const content = readFileSync(path.resolve(__dirname, './index.vue'), 'utf-8');

  const ctx = createCompilationCtx();
  ctx.init({ filename: './index.vue', source: content });

  console.time('testDefineExpose transform duration');
  console.log();

  const ast = parseSFC(content, ctx.data);
  const result = transform(ast, ctx.data);

  console.timeEnd('testDefineExpose transform duration');
  console.log();

  const code = generate(result, ctx.data).code;
  writeFileSync(path.join(__dirname, './preview.tsx'), code, 'utf-8');

  logger.printAll();
}

testDefineExpose();
