import { createCompilationCtx } from '@compiler/context';
import { generate } from '@core/codegen';
import { parse } from '@core/parse';
import { logger } from '@shared/logger';
import { getDirname } from '@shared/path';
import { transform } from '@src/core/transform/sfc';
import { readFileSync } from 'fs';
import path from 'path';

function testRouterAdapter() {
  const __dirname = getDirname(import.meta.url);
  const source = readFileSync(path.resolve(__dirname, './index.vue'), 'utf-8');

  const ctx = createCompilationCtx();
  ctx.init({ filename: './index.vue', source });

  console.time('\ntestRouterAdapter transform duration');

  const ast = parse(source, ctx.data);
  const ir = transform(ast, ctx.data);
  const code = generate(ir, ctx.data).code;

  console.timeEnd('\ntestRouterAdapter transform duration');
  console.log();
  console.log(code);

  logger.printAll();
}

testRouterAdapter();
