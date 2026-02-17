import { generate } from '@babel/generator';
import { createCompilationCtx } from '@compiler/context';
import { parse } from '@parse/index';
import { logger } from '@shared/logger';
import { getDirname } from '@shared/path';
import { transform } from '@transform/index';
import { readFileSync } from 'fs';
import path from 'path';

function testScript() {
  const __dirname = getDirname(import.meta.url);
  const content = readFileSync(path.resolve(__dirname, './test-script.ts'), 'utf-8');

  const ctx = createCompilationCtx();
  ctx.init({ inputType: 'script-ts', filename: './test-script.ts', source: content });

  console.time('[testScript]: transform duration');

  const ast = parse(content, ctx.data);
  const result = transform(ast, ctx.data);

  console.timeEnd('[testScript]: transform duration');

  console.log('\n======================== Transform Result ========================: \n');
  console.log(result);

  console.log('\n======================== Generate Result ========================: \n');
  console.log(generate(result.script.scriptAST!).code);

  logger.printAll();
}

testScript();
