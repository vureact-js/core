import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import * as t from '@babel/types';
import { ICompilationContext } from '@compiler/context/types';
import { resolveWithDefaults } from '@core/transform/sfc/script/syntax-processor/postprocess/resolve-with-defaults';
import { resolveWithDefaultsOptions } from '@core/transform/sfc/script/syntax-processor/preprocess/resolve-with-defaults';

function createMockCtx(overrides?: Partial<ICompilationContext>): ICompilationContext {
  return {
    inputType: 'sfc',
    propField: 'props',
    fileId: 'test',
    source: '',
    filename: 'test.vue',
    imports: new Map(),
    cssVars: [],
    templateData: {
      slots: {},
      refBindings: { domRefs: {}, componentRefs: {} },
      reactiveBindings: {},
      declaredProps: new Set(),
      declaredEmits: new Set(),
    },
    scriptData: {
      lang: 'ts',
      source: '',
      propsTSIface: { name: '', propsTypes: [], emitTypes: [], slotTypes: [] },
      provide: { name: '', value: '', isOccupied: false, provide: {} },
      forwardRef: { enabled: false, refField: 'expose' },
      declaredOptions: {},
      __vureact_script_block_ir: { exports: [] },
    },
    styleData: { filePath: '' },
    ...overrides,
  };
}

function runPreprocess(
  code: string,
  ctx: ICompilationContext,
): { ast: t.File; ctx: ICompilationContext } {
  const ast = parse(code, {
    sourceType: 'module',
    plugins: ['typescript'],
  }) as unknown as t.File;

  const visitor = resolveWithDefaultsOptions(ctx, ast as any);

  traverse(ast, visitor);

  return { ast, ctx };
}

function runPostprocess(ast: t.File, ctx: ICompilationContext) {
  const visitor = resolveWithDefaults(ctx);
  traverse(ast, visitor);
}

function runFullTransform(
  code: string,
  ctx?: ICompilationContext,
): { ast: t.File; ctx: ICompilationContext } {
  const fullCtx = ctx || createMockCtx();
  const { ast } = runPreprocess(code, fullCtx);
  runPostprocess(ast, fullCtx);
  return { ast, ctx: fullCtx };
}

describe('resolveWithDefaultsOptions (preprocess)', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  test('ignores non-withDefaults calls', () => {
    const code = 'const props = defineProps<{ msg?: string }>();';
    const ctx = createMockCtx();
    runPreprocess(code, ctx);

    expect(ctx.scriptData.propsWithDefaults).toBeUndefined();
    expect(ctx.propField).toBe('props');
  });

  test('logs error when withDefaults is not assigned to a variable', () => {
    const code = 'withDefaults(defineProps<{ msg?: string }>(), { msg: "hello" });';
    const ctx = createMockCtx();
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

    runPreprocess(code, ctx);

    expect(ctx.scriptData.propsWithDefaults).toBeUndefined();
    spy.mockRestore();
  });

  test('logs error when no arguments provided', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const code = `const props = withDefaults();`;
    const ctx = createMockCtx();
    runPreprocess(code, ctx);

    expect(ctx.scriptData.propsWithDefaults).toBeUndefined();
    spy.mockRestore();
  });

  test('logs error when first argument is not defineProps call', () => {
    const code = `const props = withDefaults('hello', { msg: 'hello' });`;
    const ctx = createMockCtx();
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

    runPreprocess(code, ctx);

    expect(ctx.scriptData.propsWithDefaults).toBeUndefined();
    spy.mockRestore();
  });

  test('logs error when second argument is not an object literal', () => {
    const code = `const props = withDefaults(defineProps<{ msg?: string }>(), someVar);`;
    const ctx = createMockCtx();
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

    runPreprocess(code, ctx);

    expect(ctx.scriptData.propsWithDefaults).toBeUndefined();
    spy.mockRestore();
  });

  test('records propsWithDefaults and inserts placeholder', () => {
    const code = `const props = withDefaults(defineProps<{ msg?: string; count?: number }>(), {
      msg: 'hello',
      count: 42,
    });`;

    const ctx = createMockCtx();
    const { ast } = runPreprocess(code, ctx);

    // 检查上下文是否记录了正确的信息
    expect(ctx.scriptData.propsWithDefaults).toBeDefined();
    expect(ctx.scriptData.propsWithDefaults!.varName).toBe('props');
    expect(ctx.scriptData.propsWithDefaults!.values).toBeDefined();
    expect(ctx.scriptData.propsWithDefaults!.start).toBeDefined();
    expect(ctx.scriptData.propsWithDefaults!.end).toBeDefined();

    // 检查 propField 已被重命名
    expect(ctx.propField).toBe('vrProps');

    // 检查占位符是否被插入到 AST 中
    let hasPlaceholder = false;
    traverse(ast, {
      EmptyStatement(path) {
        if (
          path.node.leadingComments?.some(
            (c) => c.type === 'CommentBlock' && c.value.includes('from withDefaults'),
          )
        ) {
          hasPlaceholder = true;
        }
      },
    });
    expect(hasPlaceholder).toBe(true);

    // 检查 withDefaults 是否被替换为 defineProps
    let definePropsCall: t.CallExpression | undefined;
    traverse(ast, {
      CallExpression(path) {
        if (t.isIdentifier(path.node.callee) && path.node.callee.name === 'defineProps') {
          definePropsCall = path.node;
        }
      },
    });
    expect(definePropsCall).toBeDefined();
  });

  test('flattens function-wrapped default values', () => {
    const code = `const props = withDefaults(defineProps<{ labels: string[] }>(), {
      labels: () => ['one', 'two'],
    });`;

    const ctx = createMockCtx();
    runPreprocess(code, ctx);

    const values = ctx.scriptData.propsWithDefaults!.values as t.ObjectExpression;
    const labelsProp = values.properties[0] as t.ObjectProperty;

    // 函数包装已被展开，labels 的值应该是数组字面量，而不是箭头函数
    expect(t.isArrayExpression(labelsProp.value)).toBe(true);
    const arr = labelsProp.value as t.ArrayExpression;
    expect(arr.elements.map((e) => (e as t.StringLiteral).value)).toEqual(['one', 'two']);
  });

  test('preserves non-function-wrapped default values as-is', () => {
    const code = `const props = withDefaults(defineProps<{ msg?: string; count?: number }>(), {
      msg: 'hello',
      count: 42,
    });`;

    const ctx = createMockCtx();
    runPreprocess(code, ctx);

    const values = ctx.scriptData.propsWithDefaults!.values as t.ObjectExpression;

    const msgProp = values.properties[0] as t.ObjectProperty;
    expect(t.isStringLiteral(msgProp.value)).toBe(true);
    expect((msgProp.value as t.StringLiteral).value).toBe('hello');

    const countProp = values.properties[1] as t.ObjectProperty;
    expect(t.isNumericLiteral(countProp.value)).toBe(true);
    expect((countProp.value as t.NumericLiteral).value).toBe(42);
  });
});

describe('resolveWithDefaults (postprocess)', () => {
  test('replaces placeholder with useMemo variable declaration', () => {
    const code = `const props = withDefaults(defineProps<{ msg?: string; count?: number }>(), {
      msg: 'hello',
      count: 42,
    });`;

    const ctx = createMockCtx();
    const { ast } = runFullTransform(code, ctx);

    // 检查 useMemo 是否被插入
    let useMemoCall: t.CallExpression | undefined;
    traverse(ast, {
      CallExpression(path) {
        if (t.isIdentifier(path.node.callee) && path.node.callee.name === 'useMemo') {
          useMemoCall = path.node;
        }
      },
    });

    expect(useMemoCall).toBeDefined();

    // 检查是否有 useMemo 的导入记录
    const reactImports = ctx.imports.get('react');
    expect(reactImports).toBeDefined();
    expect(reactImports!.some((i) => i.name === 'useMemo')).toBe(true);
  });

  test('generates correct useMemo structure', () => {
    const code = `const props = withDefaults(defineProps<{ msg?: string; count?: number }>(), {
      msg: 'hello',
      count: 42,
    });`;

    const ctx = createMockCtx();
    const { ast } = runFullTransform(code, ctx);

    let useMemoCall: t.CallExpression | undefined;
    traverse(ast, {
      CallExpression(path) {
        if (t.isIdentifier(path.node.callee) && path.node.callee.name === 'useMemo') {
          useMemoCall = path.node;
        }
      },
    });

    expect(useMemoCall).toBeDefined();

    // 检查参数
    const [arrowFn, deps] = useMemoCall!.arguments;

    // 第一个参数应该是箭头函数
    expect(t.isArrowFunctionExpression(arrowFn)).toBe(true);

    // 箭头函数体应该是一个对象表达式
    const body = (arrowFn as t.ArrowFunctionExpression).body;
    expect(t.isObjectExpression(body)).toBe(true);

    const obj = body as t.ObjectExpression;

    // 第一个成员应该是 spread element：...vrProps
    expect(t.isSpreadElement(obj.properties[0])).toBe(true);

    // 后续成员应该是默认值合并
    const msgProp = obj.properties[1] as t.ObjectProperty;
    expect(
      t.isIdentifier(msgProp.key)
        ? (msgProp.key as t.Identifier).name
        : (msgProp.key as t.StringLiteral).value,
    ).toBe('msg');
    expect(t.isLogicalExpression(msgProp.value)).toBe(true);

    // 第二个参数应该是依赖数组 [vrProps]
    expect(t.isArrayExpression(deps)).toBe(true);
    const depsArray = deps as t.ArrayExpression;
    expect(depsArray.elements.length).toBe(1);
    expect((depsArray.elements[0] as t.Identifier).name).toBe('vrProps');
  });

  test('uses correct variable name from withDefaults', () => {
    const code = `const myProps = withDefaults(defineProps<{ msg?: string }>(), {
      msg: 'hello',
    });`;

    const ctx = createMockCtx();
    const { ast } = runFullTransform(code, ctx);

    let varDecl: t.VariableDeclaration | undefined;
    traverse(ast, {
      VariableDeclaration(path) {
        const decl = path.node.declarations[0];
        if (decl && t.isIdentifier(decl.id) && decl.id.name === 'myProps') {
          varDecl = path.node;
        }
      },
    });

    expect(varDecl).toBeDefined();
    expect(varDecl!.declarations.length).toBe(1);
    expect((varDecl!.declarations[0]?.init as t.CallExpression).callee).toBeDefined();
  });

  test('preserves type parameters on useMemo', () => {
    const code = `const props = withDefaults(defineProps<{ msg?: string }>(), {
      msg: 'hello',
    });`;

    const ctx = createMockCtx();
    const { ast } = runFullTransform(code, ctx);

    let useMemoCall: t.CallExpression | undefined;
    traverse(ast, {
      CallExpression(path) {
        if (t.isIdentifier(path.node.callee) && path.node.callee.name === 'useMemo') {
          useMemoCall = path.node;
        }
      },
    });

    expect(useMemoCall).toBeDefined();
    // Type parameters should be preserved for TS
    expect(useMemoCall!.typeParameters).toBeDefined();
  });

  test('handles non-TS input', () => {
    const code = `const props = withDefaults(defineProps({ msg: String, count: Number }), {
      msg: 'hello',
      count: 42,
    });`;

    const ctx = createMockCtx({
      scriptData: {
        lang: 'js',
        source: '',
        propsTSIface: { name: '', propsTypes: [], emitTypes: [], slotTypes: [] },
        provide: { name: '', value: '', isOccupied: false, provide: {} },
        forwardRef: { enabled: false, refField: 'expose' },
        declaredOptions: {},
        __vureact_script_block_ir: { exports: [] },
      },
    });

    const { ast } = runFullTransform(code, ctx);

    let useMemoCall: t.CallExpression | undefined;
    traverse(ast, {
      CallExpression(path) {
        if (t.isIdentifier(path.node.callee) && path.node.callee.name === 'useMemo') {
          useMemoCall = path.node;
        }
      },
    });

    // In JS mode, the postprocess should still generate useMemo
    expect(useMemoCall).toBeDefined();
    // No type parameters in JS mode (undefined, not null)
    expect(useMemoCall!.typeParameters).toBeUndefined();
  });

  test('does nothing when no withDefaults used', () => {
    const code = `const msg = 'hello';`;
    const ctx = createMockCtx();
    const { ast } = runFullTransform(code, ctx);

    let useMemoCallCount = 0;
    traverse(ast, {
      CallExpression(path) {
        if (t.isIdentifier(path.node.callee) && path.node.callee.name === 'useMemo') {
          useMemoCallCount++;
        }
      },
    });

    expect(useMemoCallCount).toBe(0);
    expect(ctx.scriptData.propsWithDefaults).toBeUndefined();
  });

  test('does nothing for non-SFC input', () => {
    const code = `const props = withDefaults(defineProps<{ msg?: string }>(), { msg: 'hello' });`;
    const ctx = createMockCtx({ inputType: 'script-ts' });
    const { ast } = runFullTransform(code, ctx);

    let useMemoCallCount = 0;
    traverse(ast, {
      CallExpression(path) {
        if (t.isIdentifier(path.node.callee) && path.node.callee.name === 'useMemo') {
          useMemoCallCount++;
        }
      },
    });

    expect(useMemoCallCount).toBe(0);
  });

  test('handles function-wrapped default values correctly', () => {
    const code = `const props = withDefaults(defineProps<{ labels: string[]; fn: () => number }>(), {
      labels: () => ['one', 'two'],
      fn: () => 42,
    });`;

    const ctx = createMockCtx();
    const { ast } = runFullTransform(code, ctx);

    let useMemoCall: t.CallExpression | undefined;
    traverse(ast, {
      CallExpression(path) {
        if (t.isIdentifier(path.node.callee) && path.node.callee.name === 'useMemo') {
          useMemoCall = path.node;
        }
      },
    });

    expect(useMemoCall).toBeDefined();

    const arrowFn = useMemoCall!.arguments[0] as t.ArrowFunctionExpression;
    const obj = arrowFn.body as t.ObjectExpression;

    // labels 应该是数组字面量而不是箭头函数
    // properties: [SpreadElement(vrProps), labels, fn]
    const labelsProp = obj.properties[1] as t.ObjectProperty;
    const keyName = t.isIdentifier(labelsProp.key) ? (labelsProp.key as t.Identifier).name : '';
    expect(keyName).toBe('labels');
    const logicalExpr = labelsProp.value as t.LogicalExpression;
    expect(t.isArrayExpression(logicalExpr.right)).toBe(true);
    const arr = logicalExpr.right as t.ArrayExpression;
    expect((arr.elements[0] as t.StringLiteral).value).toBe('one');
    expect((arr.elements[1] as t.StringLiteral).value).toBe('two');
  });

  test('preserves leading comments from placeholder', () => {
    const code = `// some comment
const props = withDefaults(defineProps<{ msg?: string }>(), {
  msg: 'hello',
});`;

    const ctx = createMockCtx();
    const { ast } = runFullTransform(code, ctx);

    let varDecl: t.VariableDeclaration | undefined;
    traverse(ast, {
      VariableDeclaration(path) {
        const decl = path.node.declarations[0];
        if (decl && t.isIdentifier(decl.id) && decl.id.name === 'props') {
          varDecl = path.node;
        }
      },
    });

    expect(varDecl).toBeDefined();
    expect(varDecl!.leadingComments).toBeDefined();
    expect(varDecl!.leadingComments!.some((c) => c.value.includes('from withDefaults'))).toBe(true);
  });
});
