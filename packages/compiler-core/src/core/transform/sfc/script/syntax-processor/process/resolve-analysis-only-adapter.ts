import { Binding, NodePath, TraverseOptions } from '@babel/traverse';
import * as t from '@babel/types';
import { ICompilationContext } from '@compiler/context/types';
import { ADAPTER_RULES, AdapterRule } from '@consts/adapters-map';
import { VUE_PACKAGES } from '@consts/other';
import { recordImport } from '@transform/shared';
import { replaceCallName, replaceIdName } from '../../shared/babel-utils';
import { analyzeDeps } from '../../shared/dependency-analyzer';

/**
 * 处理“仅依赖分析”的适配规则。
 * 同样只在 Vue 生态 import 来源上生效，避免误命中局部变量。
 */
export function resolveAnalysisOnlyAdapter(ctx: ICompilationContext): TraverseOptions {
  return {
    'CallExpression|Identifier'(path) {
      const node = path.node;
      const apiName = getApiName(node as any);

      const adapter = ADAPTER_RULES.runtime[apiName];

      if (!adapter || adapter.type !== 'analyzed-deps') {
        return;
      }

      if (!isVueApiReference(path as NodePath<t.CallExpression | t.Identifier>, apiName)) {
        return;
      }

      if (t.isCallExpression(node)) {
        resolveCallNode(path as any, adapter, ctx);
      } else {
        replaceIdName(node, adapter.target);
      }

      recordImport(ctx, adapter.package, adapter.target);
    },
  };
}

function getApiName(node: t.CallExpression | t.Identifier): string {
  const isCallNode = t.isCallExpression(node);

  let apiName = '';

  if (t.isIdentifier(node)) {
    apiName = node.name;
  } else if (isCallNode && t.isIdentifier(node.callee)) {
    apiName = node.callee.name;
  }

  return apiName;
}

/**
 * 处理需要依赖分析的 API（如 watchEffect、生命周期等）。
 */
function resolveCallNode(
  path: NodePath<t.CallExpression>,
  adapter: AdapterRule,
  ctx: ICompilationContext,
) {
  const { node } = path;
  const { arguments: args } = node;

  if (!args.length) return;

  const fn = args[0];
  if (!t.isArrowFunctionExpression(fn) && !t.isFunctionExpression(fn)) {
    return;
  }

  const fnPath = path.get('arguments')[0] as NodePath<t.Expression>;
  const deps = analyzeDeps(fn, ctx, fnPath);

  args.push(deps);

  replaceCallName(node, adapter.target);
  recordImport(ctx, adapter.package, adapter.target);
}

function isVueApiReference(path: NodePath<t.CallExpression | t.Identifier>, apiName: string): boolean {
  if (path.isIdentifier()) {
    if (path.parentPath.isCallExpression() && path.parentPath.node.callee === path.node) {
      return false;
    }

    if (!path.isReferencedIdentifier()) {
      return false;
    }
  }

  if (path.isCallExpression()) {
    const callee = path.get('callee');
    if (!callee.isIdentifier()) return false;
    return isVueImportBinding(callee.scope.getBinding(apiName));
  }

  return isVueImportBinding(path.scope.getBinding(apiName));
}

function isVueImportBinding(binding?: Binding): boolean {
  if (!binding) return false;

  const bindingPath = binding.path;
  if (
    !bindingPath.isImportSpecifier() &&
    !bindingPath.isImportDefaultSpecifier() &&
    !bindingPath.isImportNamespaceSpecifier()
  ) {
    return false;
  }

  const parent = bindingPath.parentPath?.node;
  if (!parent || !t.isImportDeclaration(parent)) {
    return false;
  }

  const source = parent.source.value.toLowerCase();

  if (source.startsWith('@vue/')) {
    return true;
  }

  if (source === 'vue-router' || source.startsWith('vue-router/')) {
    return true;
  }

  return VUE_PACKAGES.some((name) => source === name || source.startsWith(`${name}/`));
}