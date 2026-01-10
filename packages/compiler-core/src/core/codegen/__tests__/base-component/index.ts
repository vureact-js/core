import { createCompilationCtx } from '@compiler/context';
import { generate } from '@core/codegen';
import { parse } from '@core/parse';
import { transform } from '@core/transform';
import { logger } from '@shared/logger';
import { getDirname } from '@shared/path';
import { readFileSync, writeFileSync } from 'fs';
import path from 'path';

export function baseComponent() {
  const __dirname = getDirname(import.meta.url);
  const content = readFileSync(path.resolve(__dirname, './index.vue'), 'utf-8');

  const ctx = createCompilationCtx();
  ctx.init({ filename: './index.vue', source: content });

  console.time('\nBase component generate duration');

  const ast = parse(content, ctx.data);
  const ir = transform(ast, ctx.data);
  const { code } = generate(ir, ctx.data, {
    jsescOption: {
      // 配置 jsesc 避免 Unicode 转义
      minimal: true, // 只转义必要的字符
      quotes: 'double',
    },
  });

  console.timeEnd('\nBase component generate duration');

  console.log('\n=============== Compilation context data: ===============\n');

  ctx.data.source = 'I cleared it.';
  console.log(ctx.data);

  logger.printAll();

  writeFileSync(path.resolve(__dirname, `./preview.${ctx.data.scriptData.lang}x`), code, 'utf-8');
}
