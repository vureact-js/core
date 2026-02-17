import { generate } from '@babel/generator';
import { createCompilationCtx } from '@compiler/context';
import { parseSFC } from '@core/parse';
import { logger } from '@shared/logger';
import { getDirname } from '@shared/path';
import { transform } from '@src/core/transform/sfc';
import { readFileSync } from 'fs';
import path from 'path';

function testTemplateRef() {
  const __dirname = getDirname(import.meta.url);
  const content = readFileSync(path.resolve(__dirname, './index.vue'), 'utf-8');

  const ctx = createCompilationCtx();
  ctx.init({ filename: './index.vue', source: content });

  console.time('testTemplateRef transform duration');
  console.log();

  const ast = parseSFC(content, ctx.data);
  const result = transform(ast, ctx.data);

  console.timeEnd('testTemplateRef transform duration');
  console.log();

  console.log(generate(result.script?.statement.local!).code);

  // console.log();
  // console.log(JSON.stringify(result.template?.children, null, 2));

  logger.printAll();
}

testTemplateRef();
