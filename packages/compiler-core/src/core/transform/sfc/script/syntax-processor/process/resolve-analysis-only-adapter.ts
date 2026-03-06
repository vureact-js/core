import { NodePath, TraverseOptions } from '@babel/traverse';
import * as t from '@babel/types';
import { ICompilationContext } from '@compiler/context/types';
import { ADAPTER_RULES, AdapterRule } from '@consts/adapters-map';
import { recordImport } from '@transform/shared';
import { replaceCallName, replaceIdName } from '../../shared/babel-utils';
import { analyzeDeps } from '../../shared/dependency-analyzer';

/**
 * 解决仅需依赖分析的适配器规则，但还需替换为适配 API 名
 */
export function resolveAnalysisOnlyAdapter(ctx: ICompilationContext): TraverseOptions {
  return {
    'CallExpression|Identifier'(path) {
      const node = path.node;
      const apiName = getApiName(node as any);

      // 目前仅有 runtime-core 的 API 需要适配
      const adapter = ADAPTER_RULES.runtime[apiName];

      if (!adapter || adapter.type !== 'analyzed-deps') {
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

  // 根据节点类型获取 API 名称
  // 如果是标识符节点，直接获取其名称
  if (t.isIdentifier(node)) {
    apiName = node.name;
  } else if (isCallNode && t.isIdentifier(node.callee)) {
    // 如果是调用表达式且被调用者是标识符，获取被调用者名称
    apiName = node.callee.name;
  }

  return apiName;
}

/**
 * 处理需要依赖分析的 API（如 watchEffect, lifecycle）
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

  // 获取箭头函数/函数表达式的路径
  const fnPath = path.get('arguments')[0] as NodePath<t.Expression>;
  const deps = analyzeDeps(fn, ctx, fnPath);

  // 添加第二个参数，依赖项
  args.push(deps);

  replaceCallName(node, adapter.target);
  recordImport(ctx, adapter.package, adapter.target);
}
