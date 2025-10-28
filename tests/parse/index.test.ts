import parser from '@parse/index';
import { readFileSync } from 'fs';
import path from 'path';

describe('Vue SFC Parser Test Suite', () => {
  it('should correctly parse an SFC and aggregate all dependencies', () => {
    const content = readFileSync(path.resolve(__dirname, './index.vue'), 'utf8');
    const result = parser(content);
    const dependencies = expect(result.template!.dependencies);

    dependencies.length(9);
    dependencies.toContain('count');
    dependencies.toContain('input');
    dependencies.toContain('forever');
    dependencies.toContain('eventName');
    dependencies.toContain('handleClick');
    dependencies.toContain('myStyle');
    dependencies.toContain('state');
    dependencies.toContain('doubled');

    expect(result!.componentName).toBe('MyComponent');
    expect(result.script!.lang).toBe('ts');
    expect(result.script!.file).not.toBeUndefined();
    expect(JSON.stringify(result.script!.file))
      .include('"reactiveType":"ref"')
      .include('"reactiveType":"computed"')
      .include('"reactiveType":"reactive"')
      .include('"isReactive":true')
      .include('"isReactive":false');

    expect(result.styles[0]?.dependencies).toContain('myStyle');
  });
});
