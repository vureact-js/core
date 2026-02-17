import { createCompilationCtx } from '@compiler/context';
import { parse } from '@parse/index';
import { logger } from '@shared/logger';
import { getDirname } from '@shared/path';
import { readFileSync } from 'fs';
import path from 'path';

function testScript() {
  const __dirname = getDirname(import.meta.url);
  const content = readFileSync(path.resolve(__dirname, './test-script.ts'), 'utf-8');

  const ctx = createCompilationCtx();
  ctx.init({ inputType: 'script-ts', filename: './test-script.ts', source: content });

  console.time('[testScript]: parse duration');

  const ast = parse(content, ctx.data);

  console.timeEnd('[testScript]: parse duration');

  console.log('\n======================== Script AST ========================: \n');
  console.log(ast.script?.ast);

  logger.printAll();
}

testScript();
