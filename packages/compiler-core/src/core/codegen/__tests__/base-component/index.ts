import { generate } from '@core/codegen';
import { parse } from '@core/parse';
import { transform } from '@core/transform';
import { getDirname } from '@shared/path';
import { readFileSync, writeFileSync } from 'fs';
import path from 'path';

export function baseComponent() {
  const __dirname = getDirname(import.meta.url);
  const content = readFileSync(path.resolve(__dirname, './index.vue'), 'utf-8');

  console.time('generate component duration');

  const ast = parse(content);
  const ir = transform(ast);
  const { code } = generate(ir, {
    jsescOption: {
      // 配置 jsesc 避免 Unicode 转义
      minimal: true, // 只转义必要的字符
      quotes: 'double',
    },
  });

  console.timeEnd('generate component duration');

  writeFileSync(path.resolve(__dirname, './preview.tsx'), code, 'utf-8');
}
