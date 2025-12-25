import { NodePath } from '@babel/core';
import * as t from '@babel/types';
import { RuntimeModules, RV3_HOOKS } from '@consts/runtimeModules';
import { recordImport } from '@shared/runtime-utils';

export function transformNextTick(path: NodePath<t.CallExpression>) {
  const { node } = path;
  if (t.isIdentifier(node.callee) && node.callee.name !== RV3_HOOKS.nextTick) return;
  recordImport(RuntimeModules.RV3_HOOKS, RV3_HOOKS.nextTick, true);
}
