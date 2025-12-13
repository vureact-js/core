import { generate } from '@babel/generator';
import { generateJsx } from '@core/codegen/jsx';
import { parse } from '@core/parse';
import { transform } from '@core/transform';
import { getDirname } from '@shared/path';
import { readFileSync, writeFileSync } from 'fs';
import path from 'path';

export function baseJsx() {
  const __dirname = getDirname(import.meta.url);
  const content = readFileSync(path.resolve(__dirname, './index.vue'), 'utf-8');

  console.time('generate jsx duration');

  const ast = parse(content);
  const ir = transform(ast);
  const jsx = generateJsx(ir);

  console.timeEnd('generate jsx duration');

  if (jsx) {
    writeFileSync(
      path.resolve(__dirname, './preview.jsx'),
      generate(jsx, {
        jsescOption: {
          // 配置 jsesc 避免 Unicode 转义
          minimal: true, // 只转义必要的字符
          quotes: 'double',
        },
      }).code,
      'utf-8',
    );
  }
}
