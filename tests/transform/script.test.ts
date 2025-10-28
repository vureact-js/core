import generate from '@babel/generator';
import parser from '@parse/index';
import { transformScript } from '@transform/transform-script';
import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';

describe('Vue SFC Script Transformer Test Suite', () => {
  it('transform vue script test', () => {
    const content = readFileSync(path.resolve(__dirname, './script.vue'), 'utf8');
    const result = parser(content, { filename: 'script.vue' });

    const scriptAst = transformScript(result);
    const scriptContent = generate(scriptAst!.ast).code;

    expect(result.componentName).toBe('ScriptTest');

    console.log('defindProps: ', scriptAst?.context.props);
    console.log('defindEmits: ', scriptAst?.context.emits);

    mkdirSync(path.resolve(__dirname, './output'), { recursive: true });
    writeFileSync(path.resolve(__dirname, `./output/script.jsx`), scriptContent);
  });
});
