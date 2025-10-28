import generate from '@babel/generator';
import parser from '@parse/index';
import { transformTemplate } from '@transform/transform-template';
import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';

describe('Vue SFC Template Transformer Test Suite', () => {
  it('transform template to jsx test', () => {
    const content = readFileSync(path.resolve(__dirname, './template.vue'), 'utf8');
    const result = parser(content);

    const jsxAst = transformTemplate(result);
    const jsx = generate(jsxAst!).code;

    // 为了避免太过复杂的测试，直接将生成的jsx写入文件后对照 vue 代码手动审查，更加灵活
    // In order to avoid overly complex testing, it is more flexible to write the generated jsx to a file
    // and then manually review it against the vue code.
    mkdirSync(path.resolve(__dirname, './output'), { recursive: true });
    writeFileSync(path.resolve(__dirname, `./output/template.jsx`), jsx);
  });
});
