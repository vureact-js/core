import { createCompilationCtx } from '@compiler/context';
import { parse } from '@parse/index';
import { logger } from '@shared/logger';
import { getDirname } from '@shared/path';
import { readFileSync } from 'fs';
import path from 'path';

function testSassStyleBlock() {
  const __dirname = getDirname(import.meta.url);
  const content = readFileSync(path.resolve(__dirname, './sass-test.vue'), 'utf-8');

  const ctx = createCompilationCtx();
  ctx.init({ 
    filename: './sass-test.vue', 
    source: content,
    preprocessStyles: true
  });

  console.time('[testSassStyleBlock]: parse duration');

  const ast = parse(content, ctx.data);

  console.timeEnd('[testSassStyleBlock]: parse duration');

  console.log('\n======================== Sass Style Content ========================: \n');
  console.log(ast.style?.source?.content);

  logger.printAll();
}

testSassStyleBlock();