import { NodePath, TraverseOptions } from '@babel/traverse';
import * as t from '@babel/types';
import { ICompilationContext } from '@compiler/context/types';
import { ADAPTER_HOOKS } from '@consts/adapters-map';
import { PACKAGE_NAME } from '@consts/other';
import { recordImport } from '@transform/shared';
import { replaceCallName } from '../../shared/babel-utils';
import { analyzeDeps } from '../../shared/dependency-analyzer';

export function resolveComplexAdapter(ctx: ICompilationContext): TraverseOptions {
  return {
    CallExpression(path) {
      const { node } = path;
      const { callee } = node;

      if (!t.isIdentifier(callee)) return;

      resolveEffect(path, ctx);
      resolveLifecycle(path, ctx);
    },
  };
}

function resolveEffect(path: NodePath<t.CallExpression>, ctx: ICompilationContext) {
  resolveOnlyDeps(path, ctx, ADAPTER_HOOKS.complex.watchEffect);
}

function resolveLifecycle(path: NodePath<t.CallExpression>, ctx: ICompilationContext) {
  resolveOnlyDeps(path, ctx, ADAPTER_HOOKS.complex.lifecycle);
}

function resolveOnlyDeps(
  path: NodePath<t.CallExpression>,
  ctx: ICompilationContext,
  adaptMap: Record<string, any>,
) {
  const { node } = path;
  const { callee } = node;

  const adapter = adaptMap[(callee as t.Identifier).name as keyof typeof adaptMap];
  if (!adapter) return '';

  const { arguments: args } = node;

  const fn = args[0]! as t.ArrowFunctionExpression;

  // 获取箭头函数/函数表达式的路径
  const fnPath = path.get('arguments')[0] as NodePath<t.Expression>;
  const deps = analyzeDeps(fn, ctx, fnPath);

  // 添加第二个参数，依赖项。
  args.push(deps);

  replaceCallName(node, adapter);
  recordImport(ctx, PACKAGE_NAME.runtime, adapter);
}
