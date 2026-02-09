import { generate } from '@babel/generator';
import { createCompilationCtx } from '@compiler/context';
import { parse } from '@core/parse';
import { transform } from '@core/transform';
import { logger } from '@shared/logger';
import { getDirname } from '@shared/path';
import { readFileSync } from 'fs';
import path from 'path';

export function testPropsIface() {
  const __dirname = getDirname(import.meta.url);
  const content = readFileSync(path.resolve(__dirname, './index.vue'), 'utf-8');

  const ctx = createCompilationCtx();
  ctx.init({ filename: './index.vue', source: content });

  console.time('\ntestInterProps transform duration');

  const ast = parse(content, ctx.data);
  const result = transform(ast, ctx.data);

  console.timeEnd('\ntestInterProps transform duration');

  // console.log(result.script?.exports);

  console.log('\nmatched component name:', ctx.data.compName, '\n');

  const code = result.script?.exports.map((node) => generate(node).code).join('');
  console.log(code);

  logger.printAll();
}

testPropsIface();
