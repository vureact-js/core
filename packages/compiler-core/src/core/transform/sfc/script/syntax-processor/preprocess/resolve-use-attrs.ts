import { NodePath, TraverseOptions } from '@babel/traverse';
import * as t from '@babel/types';
import { ICompilationContext } from '@compiler/context/types';
import { normalizePropName } from '@transform/sfc/template/shared/prop-ir-utils';
import { replaceNode } from '../../shared/babel-utils';

/**
 * 处理 useAttrs
 *
 * 转换示例：
 *
 * ```ts
 * // Vue:
 * const attrs = useAttrs();
 * const { class, style } = useAttrs();
 *
 * // React:
 * const { propA, propB, ...attrs } = props;
 * const { class, style } = props as Record<string, unkown>;
 * ```
 */
export function resolveUseAttrs(ctx: ICompilationContext): TraverseOptions {
  return {
    VariableDeclarator(path) {
      const originalTypeAnnotation = resolveVariablePattern(path.node, ctx);
      resolveInitExpression(path, originalTypeAnnotation, ctx);
    },
  };
}

/**
 * 将 useAttrs() 调用转换为对象解构，将声明的属性分离出来
 * 示例: const { propA, propB, ...attrs } = props
 */
function resolveVariablePattern(
  node: t.VariableDeclarator,
  ctx: ICompilationContext,
): t.Noop | t.TSTypeAnnotation | t.TypeAnnotation | null | undefined {
  const { id } = node;

  if (!t.isIdentifier(id)) {
    return;
  }

  const originalTypeAnnotation = id.typeAnnotation;
  const declaredProperties = buildDeclaredProperties(ctx);
  const restAttrsElement = t.restElement(t.identifier(id.name));
  const destructuredPattern = t.objectPattern([...declaredProperties, restAttrsElement]);

  node.id = destructuredPattern;

  return originalTypeAnnotation;
}

/**
 * 从上下文中构建声明的属性列表（emits + props）
 */
function buildDeclaredProperties(ctx: ICompilationContext): t.ObjectProperty[] {
  const { declaredEmits, declaredProps } = ctx.templateData;

  return [...declaredEmits, ...declaredProps].map((key) => {
    const propName = normalizePropName(key, key);
    const keyId = t.identifier(propName);

    // value 属性重命名为 [_key]，防止命名冲突
    const valueId = t.identifier(`_${propName}`);

    // 构建 { key: _key }
    return t.objectProperty(keyId, valueId);
  });
}

/**
 * 将 useAttrs() 函数调用替换为 props 引用
 */
function resolveInitExpression(
  path: NodePath<t.VariableDeclarator>,
  originalTypeAnnotation: t.Noop | t.TSTypeAnnotation | t.TypeAnnotation | null | undefined,
  ctx: ICompilationContext,
): void {
  const { init } = path.node;
  const initPath = path.get('init') as NodePath;
  const propsIdentifier = t.identifier(ctx.propField);

  // 如果初始值是 TypeScript 类型断言表达式
  if (t.isTSAsExpression(init)) {
    if (!t.isCallExpression(init.expression)) {
      return;
    }

    const typeAssertion = createPropsTypeAssertion(propsIdentifier, init.typeAnnotation);
    replaceNode(initPath, typeAssertion, init);

    return;
  }

  // 如果是 TypeScript 环境，则对 props 引用添加类型断言
  if (ctx.scriptData.lang.startsWith('ts')) {
    const typeAnnotation = t.isTSTypeAnnotation(originalTypeAnnotation)
      ? // 如果原始变量有类型注解，则提取类型注解内容
        originalTypeAnnotation.typeAnnotation
      : // 否则使用 Record<string, unknown> 作为默认类型
        t.tsTypeReference(
          t.identifier('Record'),
          t.tsTypeParameterInstantiation([t.tsStringKeyword(), t.tsUnknownKeyword()]),
        );

    // 创建 props 的类型断言表达式
    const typeAssertion = createPropsTypeAssertion(propsIdentifier, typeAnnotation);

    // 替换初始化表达式为类型断言后的 props 引用
    replaceNode(initPath, typeAssertion, propsIdentifier);

    return;
  }

  // 否则直接替换为 props 引用
  replaceNode(initPath, propsIdentifier, init!);
}

/**
 * 创建 props 的类型断言表达式
 * 示例: props as PropsType
 */
function createPropsTypeAssertion(
  propsIdentifier: t.Identifier,
  typeAnnotation: any,
): t.TSAsExpression {
  return t.tsAsExpression(propsIdentifier, typeAnnotation);
}
