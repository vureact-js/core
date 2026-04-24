import { generate } from '@codegen/index';
import { createCompilationCtx } from '@compiler/context';
import { parseSFC } from '@core/parse';
import { logger } from '@shared/logger';
import { getDirname } from '@shared/path';
import { transform } from '@src/core/transform/sfc';
import { readFileSync, writeFileSync } from 'fs';
import path from 'path';

function testScopedStyle() {
  const __dirname = getDirname(import.meta.url);
  const content = readFileSync(path.resolve(__dirname, './index.vue'), 'utf-8');

  const ctx = createCompilationCtx();
  ctx.init({ filename: './index.vue', source: content, fileId: 'abc123' });

  console.time('testScopedStyle transform duration');
  console.log();

  const ast = parseSFC(content, ctx.data);
  const ir = transform(ast, ctx.data);

  console.timeEnd('testScopedStyle transform duration');
  console.log();

  const code = generate(ir, ctx.data).code;

  writeFileSync(path.resolve(__dirname, './preview/index.tsx'), code, 'utf-8');
  writeFileSync(path.resolve(__dirname, './preview/index-abc123.css'), ir.style!, 'utf-8');

  logger.printAll();
}

testScopedStyle();
