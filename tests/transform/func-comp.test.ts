import generate from '@babel/generator';
import parser from '@parse/index';
import transformer from '@transform/index';
import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';

describe('Vue SFC Script Transformer Test Suite', () => {
  it('transform vue to jsx function component test', () => {
    const content = readFileSync(path.resolve(__dirname, './func-comp.vue'), 'utf8');
    const result = parser(content, { filename: 'func-comp.vue' });

    const tsxAST = transformer(result);
    const tsx = generate(tsxAST).code;

    expect(result.componentName).toBe('Demo');

    mkdirSync(path.resolve(__dirname, './output'), { recursive: true });
    writeFileSync(path.resolve(__dirname, `./output/func-comp.${result.script?.lang}x`), tsx);
  });
});
