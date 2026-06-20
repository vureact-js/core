import * as t from '@babel/types';
import * as depChecker from '@core/transform/sfc/script/shared/dependency-analyzer/dep-checker';
import { traceBindingSource } from '@core/transform/sfc/script/shared/dependency-analyzer/trace-utils';

describe('trace-utils', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  test('identifier init sourced from eligible binding returns identifier', () => {
    const sourceBinding: any = {};

    jest
      .spyOn(depChecker, 'isEligibleBindingSource')
      .mockImplementation((b: any) => b === sourceBinding);

    const binding: any = {
      path: {
        isVariableDeclarator: () => true,
        node: { init: t.identifier('state') },
        scope: { getBinding: (name: string) => (name === 'state' ? sourceBinding : null) },
      },
    };

    const res = traceBindingSource(binding as any, new Set(), 2);
    expect(res).not.toBeNull();
    expect(t.isIdentifier(res!)).toBe(true);
    expect((res as t.Identifier).name).toBe('state');
  });

  test('member expression with eligible root returns cloned member expression', () => {
    const sourceBinding: any = {};
    jest
      .spyOn(depChecker, 'isEligibleBindingSource')
      .mockImplementation((b: any) => b === sourceBinding);

    const binding: any = {
      path: {
        isVariableDeclarator: () => true,
        node: { init: t.memberExpression(t.identifier('state'), t.identifier('count')) },
        scope: { getBinding: (name: string) => (name === 'state' ? sourceBinding : null) },
      },
    };

    const res = traceBindingSource(binding as any, new Set(), 2);
    expect(res).not.toBeNull();
    expect(t.isMemberExpression(res!)).toBe(true);
    const me = res as t.MemberExpression;
    expect(t.isIdentifier(me.object) && (me.object as t.Identifier).name === 'state').toBe(true);
    expect(t.isIdentifier(me.property) && (me.property as t.Identifier).name === 'count').toBe(
      true,
    );
  });

  test('member expression rebuilds when root is local binding pointing to eligible source', () => {
    const stateBinding: any = { _id: 'state' };
    const aBinding: any = { _id: 'a' };

    // isEligibleBindingSource returns true only for the ultimate stateBinding
    jest
      .spyOn(depChecker, 'isEligibleBindingSource')
      .mockImplementation((b: any) => b === stateBinding);

    const bindingA: any = {
      path: {
        isVariableDeclarator: () => true,
        node: { init: t.identifier('state') },
        scope: { getBinding: (name: string) => (name === 'state' ? stateBinding : null) },
      },
    };

    const bindingB: any = {
      path: {
        isVariableDeclarator: () => true,
        node: { init: t.memberExpression(t.identifier('a'), t.identifier('count')) },
        scope: { getBinding: (name: string) => (name === 'a' ? bindingA : null) },
      },
    };

    const res = traceBindingSource(bindingB as any, new Set(), 4);
    expect(res).not.toBeNull();
    expect(t.isMemberExpression(res!)).toBe(true);
    const me = res as t.MemberExpression;
    expect(t.isIdentifier(me.object) && (me.object as t.Identifier).name === 'state').toBe(true);
    expect(t.isIdentifier(me.property) && (me.property as t.Identifier).name === 'count').toBe(
      true,
    );
  });

  test('rebuildMemberWithNewRoot returns null for unsupported object types', () => {
    // create an OptionalMemberExpression whose object is a Literal (unsupported)
    const node: any = t.optionalMemberExpression(
      t.stringLiteral('str') as any,
      t.identifier('x'),
      false,
      true,
    );
    const nextRoot = t.identifier('state');

    // call internal function via casting (simulate private use)
    // export not available; we invoke by importing module and accessing function via require cache is not feasible here
    // Instead test behavior via traceBindingSource path where rebuild will attempt replacement and fail

    const binding: any = {
      path: {
        isVariableDeclarator: () => true,
        node: { init: node },
        scope: {
          getBinding: () => ({ path: { node: { init: t.identifier('state') }, scope: {} } }),
        },
      },
    };

    // stub dep-checker to mark root as eligible so rebuild path runs
    jest
      .spyOn(
        require('@core/transform/sfc/script/shared/dependency-analyzer/dep-checker'),
        'isEligibleBindingSource',
      )
      .mockImplementation(() => true);

    const res = traceBindingSource(binding as any, new Set(), 3);
    // unsupported object type should result in null
    expect(res).toBeNull();
  });
});
