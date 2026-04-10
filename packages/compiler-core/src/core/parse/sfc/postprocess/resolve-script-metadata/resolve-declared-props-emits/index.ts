import { NodePath } from '@babel/core';
import * as t from '@babel/types';
import { ICompilationContext } from '@compiler/context/types';
import { resolveDeclaredEmits } from './resolve-declared-emits';
import { resolveDeclaredProps } from './resolve-declared-props';

/**
 * 收集 defineProps/defineEmits 中声明的属性名
 */
export function resolveDeclaredPropsAndEmits(
  path: NodePath<t.CallExpression>,
  ctx: ICompilationContext,
) {
  resolveDeclaredProps(path, ctx);
  resolveDeclaredEmits(path, ctx);
}
