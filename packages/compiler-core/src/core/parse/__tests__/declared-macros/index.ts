import { createCompilationCtx } from '@compiler/context';
import { parse } from '@core/parse';
import { logger } from '@shared/logger';
import { getDirname } from '@shared/path';
import { readFileSync } from 'fs';
import path from 'path';

function testDeclaredMacros() {
  const __dirname = getDirname(import.meta.url);
  const content = readFileSync(path.resolve(__dirname, './index.vue'), 'utf-8');

  const ctx = createCompilationCtx();

  ctx.init({ filename: './index.vue', source: content });

  console.time('[testDeclaredMacros]: parse duration');

  parse(content, ctx.data);

  console.timeEnd('[testDeclaredMacros]: parse duration');

  console.log('\n=============== templateData.declaredProps: ===============\n');
  console.log(ctx.data.templateData.declaredProps);

  console.log('\n=============== templateData.declaredEmits: ===============\n');
  console.log(ctx.data.templateData.declaredEmits);

  console.log('\n=============== scriptData.declaredOptions: ===============\n');
  console.log(ctx.data.scriptData.declaredOptions);

  logger.printAll();
}

testDeclaredMacros();
