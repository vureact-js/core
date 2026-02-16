import { NodePath, TraverseOptions } from '@babel/traverse';
import * as t from '@babel/types';
import { ICompilationContext } from '@compiler/context/types';
import { ADAPTER_HOOKS } from '@consts/adapters-map';
import { PACKAGE_NAME } from '@consts/other';
import { recordImport } from '@transform/shared';
import { replaceCallName } from '../../shared/babel-utils';
import { analyzeDeps } from '../../shared/dependency-analyzer';

export function resolveEffect(ctx: ICompilationContext): TraverseOptions {
  return {
    CallExpression(path) {
      const { node } = path;
      const { callee } = node;

      if (!t.isIdentifier(callee)) return;

      let adapter = '';
      adapter = processWatchEffect(ctx, path);

      if (!adapter) return;
      replaceCallName(node, adapter);
      recordImport(ctx, PACKAGE_NAME.runtime, adapter);
    },
  };
}

function processWatchEffect(ctx: ICompilationContext, path: NodePath<t.CallExpression>): string {
  const { node } = path;
  const { callee } = node;

  const { watchEffect: effect } = ADAPTER_HOOKS.complex;

  const adapter = effect[(callee as t.Identifier).name as keyof typeof effect];
  if (
    adapter !== effect.watchEffect &&
    adapter !== effect.watchPostEffect &&
    adapter !== effect.watchSyncEffect
  ) {
    return '';
  }

  const { arguments: args } = node;
  const [callback] = args;

  const deps = analyzeDeps(callback! as t.Expression, path);
  args.push(deps);

  return adapter;
}
