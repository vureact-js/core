import { generate } from '@codegen/index';
import { createCompilationCtx } from '@compiler/context';
import { parseSFC } from '@parse/index';
import { logger } from '@shared/logger';
import { getDirname } from '@shared/path';
import { transform } from '@transform/sfc';
import { readFileSync, writeFileSync } from 'fs';
import path from 'path';

function testVModel() {
  const __dirname = getDirname(import.meta.url);
  const content = readFileSync(path.resolve(__dirname, './index.vue'), 'utf-8');

  const ctx = createCompilationCtx();
  ctx.init({ filename: './index.vue', source: content });

  console.time('testVModel transform duration');
  console.log();

  const ast = parseSFC(content, ctx.data);
  const result = transform(ast, ctx.data);
  const code = generate(result, ctx.data);

  console.timeEnd('testVModel transform duration');

  writeFileSync(path.join(__dirname, './preview.jsx'), code.code, 'utf-8');

  logger.printAll();
}

testVModel();
