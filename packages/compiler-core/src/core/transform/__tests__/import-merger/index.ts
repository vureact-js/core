import { generate } from '@babel/generator';
import { createCompilationCtx } from '@compiler/context';
import { parseSFC } from '@core/parse';
import { logger } from '@shared/logger';
import { getDirname } from '@shared/path';
import { transform } from '@src/core/transform/sfc';
import { readFileSync, writeFileSync } from 'fs';
import path from 'path';

function testImportMerger() {
  const __dirname = getDirname(import.meta.url);
  const content = readFileSync(path.resolve(__dirname, './index.vue'), 'utf-8');

  const ctx = createCompilationCtx();
  ctx.init({ filename: './index.vue', source: content });

  console.time('testImportMerger transform duration');
  console.log();

  const ast = parseSFC(content, ctx.data);
  const result = transform(ast, ctx.data);

  console.timeEnd('testImportMerger transform duration');
  console.log();

  let code = '';
  result.script?.imports.forEach((s) => {
    code += generate(s).code;
  });

  writeFileSync(path.join(__dirname, './preview.jsx'), code, 'utf-8');

  logger.printAll();
}

testImportMerger();
