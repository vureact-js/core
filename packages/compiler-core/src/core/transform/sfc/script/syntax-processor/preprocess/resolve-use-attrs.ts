import { NodePath, TraverseOptions } from '@babel/traverse';
import * as t from '@babel/types';
import { ICompilationContext } from '@compiler/context/types';
import { replaceNode } from '../../shared/babel-utils';

/**
 * 将 useAttrs() 函数调用替换为 props 引用
 *
 * 本质上 Vue 的 attrs 透传是一个无类型约束的 js 对象
 *
 * 示例：
 *
 * ```ts
 * // Vue:
 * const attrs = useAttrs();
 * const { class, style } = useAttrs();
 *
 * // React:
 * const attrs = props as Record<string, unknown>;
 * const { class, style } = props as Record<string, unknown>;
 * ```
 */
export function resolveUseAttrs(ctx: ICompilationContext): TraverseOptions {
  return {
    VariableDeclarator(path) {
      const { init, id } = path.node;
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

      const isTS = ctx.scriptData.lang.startsWith('ts');

      // 如果是 TypeScript 环境，则对 props 引用添加类型断言
      if (isTS) {
        let typeAnnotation = null;

        // 使用已有的类型注解
        if (t.isIdentifier(id) && t.isTSTypeAnnotation(id.typeAnnotation)) {
          typeAnnotation = id.typeAnnotation.typeAnnotation;
          id.typeAnnotation = null;
        } else {
          // 否则使用默认类型：Record<string, unknown>
          typeAnnotation = t.tsTypeReference(
            t.identifier('Record'),
            t.tsTypeParameterInstantiation([t.tsStringKeyword(), t.tsUnknownKeyword()]),
          );
        }

        // 创建 props 的类型断言表达式
        const propsTypeAssertion = createPropsTypeAssertion(propsIdentifier, typeAnnotation);
        replaceNode(initPath, propsTypeAssertion, propsIdentifier);

        return;
      }

      // JavaScript 环境直接替换为 props 引用
      replaceNode(initPath, propsIdentifier, init!);
    },
  };
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
