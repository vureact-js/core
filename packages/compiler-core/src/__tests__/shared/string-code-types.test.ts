import { isIdentifier, isSimpleExpression, isStringLiteral } from '@shared/string-code-types';

describe('shared/string-code-types', () => {
  test('isSimpleExpression recognizes literals and identifiers', () => {
    expect(isSimpleExpression('123')).toBe(true);
    expect(isSimpleExpression("'abc'")).toBe(true);
    expect(isSimpleExpression('myVar')).toBe(true);
  });

  test('isSimpleExpression handles member expressions and complex cases', () => {
    // current implementation does not recursively parse member.object, so it's false
    expect(isSimpleExpression('obj.prop')).toBe(false);
    expect(isSimpleExpression('{ a: 1 }')).toBe(false);
    expect(isSimpleExpression('fn()')).toBe(false);
  });

  test('isIdentifier and isStringLiteral behaviors', () => {
    expect(isIdentifier('foo')).toBe(true);
    expect(isIdentifier('1 + 1')).toBe(false);

    expect(isStringLiteral("'str'")).toBe(true);
    expect(isStringLiteral('`templ${v}`')).toBe(false);
  });
});
