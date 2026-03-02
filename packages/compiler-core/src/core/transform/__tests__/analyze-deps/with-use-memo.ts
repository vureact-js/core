import { generate } from '@babel/generator';
import { createCompilationCtx } from '@compiler/context';
import { parse, transform } from '@core/index';
import { logger } from '@shared/logger';
import { getDirname } from '@shared/path';
import { readFileSync, writeFileSync } from 'fs';
import path from 'path';

function testWithUseMemo() {
  const __dirname = getDirname(import.meta.url);
  const content = readFileSync(path.resolve(__dirname, './with-use-memo.vue'), 'utf-8');

  const ctx = createCompilationCtx();
  ctx.init({ filename: './with-use-memo.vue', source: content });

  console.time('testAnalyzeFnDeps transform duration');
  console.log();

  const ast = parse(content, ctx.data);
  const result = transform(ast, ctx.data);

  console.timeEnd('testAnalyzeFnDeps transform duration');
  console.log();

  const { code } = generate(result.script?.statement.local!);

  writeFileSync(path.resolve(__dirname, './previews/with-use-memo.tsx'), code, 'utf-8');

  logger.printAll();
}

testWithUseMemo();
