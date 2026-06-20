import { isSimpleStyle, parseStyleString } from '@core/transform/sfc/template/shared/style-utils';

describe('style-utils', () => {
  test('isSimpleStyle recognizes Object.assign and object literals', () => {
    expect(isSimpleStyle('Object.assign({}, a)')).toBe(true);
    expect(isSimpleStyle('{a:1}')).toBe(true);
    expect(isSimpleStyle('color:red')).toBe(false);
    expect(isSimpleStyle('')).toBe(false);
  });

  test('parseStyleString returns simple styles unchanged', () => {
    expect(parseStyleString('Object.assign({}, a)')).toBe('Object.assign({}, a)');
    expect(parseStyleString('{a:1}')).toBe('{a:1}');
  });

  test('parseStyleString returns identifier unchanged', () => {
    expect(parseStyleString('foo')).toBe('foo');
  });

  test('parseStyleString handles empty trimmed string', () => {
    expect(parseStyleString('   ')).toBe('{}');
  });

  test('parseStyleString parses css text into object literal', () => {
    const css = 'color: red; background-color: blue;';
    expect(parseStyleString(css)).toBe("{color: 'red',backgroundColor: 'blue'}");
  });

  test('parseStyleString ignores invalid entries', () => {
    const css = ';;color: green;invalid; padding: 0px;';
    expect(parseStyleString(css)).toBe("{color: 'green',padding: '0px'}");
  });
});
