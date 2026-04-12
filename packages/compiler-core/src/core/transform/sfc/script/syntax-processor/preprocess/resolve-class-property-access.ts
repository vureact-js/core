import { TraverseOptions } from '@babel/traverse';
import { ICompilationContext } from '@compiler/context/types';
import { resolveClassPropertyToClassName } from '@transform/shared';

/**
 * 处理属性/类型相关的 `class` 字段替换为 `className`
 */
export function resolveClassPropertyAccess(ctx: ICompilationContext): TraverseOptions {
  return {
    'MemberExpression|OptionalMemberExpression'(path) {
      resolveClassPropertyToClassName(path);
    },
  };
}
