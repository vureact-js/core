import { NodePath, TraverseOptions } from '@babel/traverse';
import * as t from '@babel/types';
import { ICompilationContext } from '@compiler/context/types';
import { ADAPTER_RULES, AdapterRule } from '@consts/adapters-map';
import { recordImport } from '@transform/shared';
import { replaceCallName, replaceIdName } from '../../shared/babel-utils';
import { analyzeDeps } from '../../shared/dependency-analyzer';
import { isVueApiReference } from './resolve-rename-adapter';

/**
 * 处理“仅依赖分析”的适配规则。
 *
 * 判断逻辑：
 * 1. 优先检查 binding，仅当标识符来自 Vue 生态 import 时执行替换
 *    （避免将业务代码中的同名局部变量误判为 Vue API）。
 * 2. 若 binding 不存在（免 import 场景，如 unplugin-auto-import），
 *    fallback 到 AUTO_IMPORTED_APIS 白名单匹配。
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
