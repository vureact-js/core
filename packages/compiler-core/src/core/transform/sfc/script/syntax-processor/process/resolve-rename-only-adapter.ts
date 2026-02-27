import { NodePath, TraverseOptions } from '@babel/traverse';
import * as t from '@babel/types';
import { ICompilationContext } from '@compiler/context/types';
import { ADAPTER_HOOKS, ADAPTER_ROUTER_APIS, CompilerAdapterRules } from '@consts/adapters-map';
import { PACKAGE_NAME } from '@consts/other';
import { getReactiveType } from '@shared/reactive-utils';
import { recordImport } from '@transform/shared';
import {
  getVariableDeclaratorPath,
  replaceCallName,
  replaceIdName,
} from '../../shared/babel-utils';
import { setScriptNodeMeta } from '../../shared/metadata-utils';

/**
 * 处理仅需替换调用名的简单适配，由运行时适配 API 完全模拟它们。
 */
export function resolveRenameOnlyAdapter(ctx: ICompilationContext): TraverseOptions {
  return {
    'Identifier|CallExpression'(path) {
      // 处理 Vue API
      resolveAdapterRules(PACKAGE_NAME.runtime, ADAPTER_HOOKS, path, ctx);
      // 处理 Vue Router API
      resolveAdapterRules(PACKAGE_NAME.router, ADAPTER_ROUTER_APIS, path, ctx);
    },
  };
}

function resolveAdapterRules(
  pkgName: string,
  rules: CompilerAdapterRules,
  path: NodePath<t.Identifier | t.CallExpression | t.Node>,
  ctx: ICompilationContext,
) {
  const node = path.node;
  const isCallExpr = t.isCallExpression(node);

  let sourceName = '';

  // 获取 API 名称
  if (t.isIdentifier(node)) {
    sourceName = node.name;
  } else if (isCallExpr && t.isIdentifier(node.callee)) {
    sourceName = node.callee.name;
  }

  const { pure, effectful } = rules.renameOnly;

  // 获取对应适配 API
  const pureApi = pure[sourceName];
  const effectfulApi = effectful[sourceName];
  const adapter = pureApi || effectfulApi;

  if (!adapter) return;

  // 需标记父节点（变量声明节点）为可以被收集收集
  if (effectfulApi) {
    const reactiveType = getReactiveType(sourceName);
    const declaratorPath = getVariableDeclaratorPath(path);

    setScriptNodeMeta(declaratorPath?.node, {
      is_reactive: true,
      reactive_type: reactiveType,
    });
  }

  // 替换原 API 名
  if (isCallExpr) {
    replaceCallName(node, adapter);
  } else {
    replaceIdName(node, adapter);
  }

  recordImport(ctx, pkgName, adapter);

  // 如果使用了路由需要标记到上下文
  if (pkgName === PACKAGE_NAME.router && !ctx.route) {
    ctx.route = true;
  }
}
