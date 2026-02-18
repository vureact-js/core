import { generate } from '@babel/generator';
import { createCompilationCtx } from '@compiler/context';
import { parseSFC } from '@core/parse';
import { logger } from '@shared/logger';
import { getDirname } from '@shared/path';
import { transform } from '@transform/index';
import { readFileSync } from 'fs';
import path from 'path';

function testMacroUsage() {
  const __dirname = getDirname(import.meta.url);
  const content = readFileSync(path.resolve(__dirname, './index.vue'), 'utf-8');

  const ctx = createCompilationCtx();
  ctx.init({ filename: './index.vue', source: content });

  console.time('\[testMacroUsage] transform duration');

  const ast = parseSFC(content, ctx.data);
  const result = transform(ast, ctx.data);

  console.timeEnd('\[testMacroUsage] transform duration');

  console.log('\n===================== Transform DefineEmits Var Usage =====================: \n');

  result.template.children.forEach((child) => {
    if ('props' in child) {
      console.log(child.props);
    }
  });

  console.log();
  console.log(generate(result.script.statement.local!).code);

  logger.printAll();
}

testMacroUsage();
