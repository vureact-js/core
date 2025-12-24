import { NodePath } from '@babel/core';
import * as t from '@babel/types';
import { RV3_HOOKS } from '@consts/runtimeModules';
import { reactHookBuilder } from './builders/react-hook-builder';
import { setNodeExtensionMeta } from './shared/babel-utils';
import { requiredCallExpHandling } from './shared/required-before-transform';

const adaptApis = {
  watch: RV3_HOOKS.useWatch,
} as const;

export function transformWatch(path: NodePath<t.CallExpression>) {
  const result = requiredCallExpHandling(path, adaptApis, { checkHookArgs: false });

  if (!result) return;

  const { args } = result;
  const { parent } = path;

  // 变量声明的 watch 返回值标记为间接响应式
  if (t.isVariableDeclarator(parent)) {
    setNodeExtensionMeta(parent, { isReactive: true, reactiveType: 'indirect' });
  }

  path.replaceWith(reactHookBuilder.useWatch(args));
}
