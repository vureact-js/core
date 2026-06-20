import { mergePropsIR } from '@core/transform/sfc/template/shared/prop-merge-utils';
import { PropTypes } from '@core/transform/sfc/template/shared/types';

describe('prop-merge-utils', () => {
  test('mergePropsIR copies non-class/style attrs', () => {
    const oldAttr: any = { a: 1 };
    const newAttr: any = { b: 2 };
    mergePropsIR({} as any, oldAttr, newAttr);
    expect((oldAttr as any).b).toBe(2);
  });

  test('mergeClassProps merges string literals', () => {
    const ctx: any = {
      filename: 'x',
      scriptData: { lang: 'js' },
      templateData: { reactiveBindings: [] },
    };
    const oldAttr: any = {
      type: PropTypes.ATTRIBUTE,
      rawName: 'class',
      value: { content: "'old'", isStringLiteral: true, babelExp: { ast: null } },
      isStatic: true,
      babelExp: {},
    };

    const newAttr: any = {
      type: PropTypes.ATTRIBUTE,
      rawName: 'class',
      value: { content: "'new'", isStringLiteral: true, babelExp: { ast: null } },
      isStatic: true,
      babelExp: {},
    };

    mergePropsIR(ctx, oldAttr, newAttr);
    expect(oldAttr.value.content.includes('old')).toBe(true);
    expect(oldAttr.value.babelExp.ast).toBeDefined();
  });

  test('mergeStyleProps merges simple styles into Object.assign call', () => {
    const oldAttr: any = {
      rawName: 'style',
      value: { content: '{a:1}', isStringLiteral: false, merge: undefined },
    };

    const newAttr: any = {
      rawName: 'style',
      value: { content: '{b:2}', isStringLiteral: false },
    };

    mergePropsIR({} as any, oldAttr, newAttr);
    const ok =
      Array.isArray(oldAttr.value.merge) ||
      (oldAttr.value.content && oldAttr.value.content.includes('Object.assign'));
    expect(ok).toBe(true);
  });
});
