import { NodePath, TraverseOptions } from '@babel/traverse';
import * as t from '@babel/types';
import { ICompilationContext } from '@compiler/context/types';
import { ADAPTER_HOOKS, ADAPTER_ROUTER_APIS, CompilerAdapterRules } from '@consts/adapters-map';
import { PACKAGE_NAME } from '@consts/other';
import { recordImport } from '@transform/shared';
import { replaceCallName, replaceIdName } from '../../shared/babel-utils';
import { analyzeDeps } from '../../shared/dependency-analyzer';

/**
 * 处理需要额外处理（如收集依赖、添加参数等）的复杂适配，无法完全由运行时处理
 */
export function resolveTransformAdapter(ctx: ICompilationContext): TraverseOptions {
  return {
    'Identifier|CallExpression'(path) {
      // 处理 Vue API
      resolveTransformAdapterRules(PACKAGE_NAME.runtime, ADAPTER_HOOKS, path, ctx);
      // 处理 Vue Router API
      resolveTransformAdapterRules(PACKAGE_NAME.router, ADAPTER_ROUTER_APIS, path, ctx);
    },
  };
}

function resolveTransformAdapterRules(
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

  const { pure, effectful } = rules.transform;

  // 1. 处理需要依赖分析的 API（watchEffect 系列）
  const watchEffectAdapter = findNestedAdapter(sourceName, pure.watchEffect);
  if (watchEffectAdapter) {
    if (isCallExpr) {
      handleDependencyAnalysisAPI(
        path as NodePath<t.CallExpression>,
        ctx,
        watchEffectAdapter,
        pkgName,
      );
    } else {
      // Identifier 情况：直接重命名
      replaceIdName(node as t.Identifier, watchEffectAdapter);
      recordImport(ctx, pkgName, watchEffectAdapter);
    }
    return;
  }

  // 2. 处理需要依赖分析的 API（lifecycle 系列）
  const lifecycleAdapter = findNestedAdapter(sourceName, pure.lifecycle);
  if (lifecycleAdapter) {
    if (isCallExpr) {
      handleDependencyAnalysisAPI(
        path as NodePath<t.CallExpression>,
        ctx,
        lifecycleAdapter,
        pkgName,
      );
    } else {
      // Identifier 情况：直接重命名
      replaceIdName(node as t.Identifier, lifecycleAdapter);
      recordImport(ctx, pkgName, lifecycleAdapter);
    }
    return;
  }

  // 3. 处理其他纯 API（直接重命名）
  const pureApi = pure[sourceName];
  if (pureApi) {
    if (isCallExpr) {
      replaceCallName(node as t.CallExpression, pureApi);
    } else {
      replaceIdName(node as t.Identifier, pureApi);
    }
    recordImport(ctx, pkgName, pureApi);
    return;
  }

  // 4. 处理有副作用的 API（目前为空，保留扩展性）
  const effectfulApi = effectful[sourceName];
  if (effectfulApi) {
    // 这里可以处理有副作用的 transform API
    // 目前 effectful.transform 是空的，但保留扩展性
    if (isCallExpr) {
      replaceCallName(node as t.CallExpression, effectfulApi);
    } else {
      replaceIdName(node as t.Identifier, effectfulApi);
    }
    recordImport(ctx, pkgName, effectfulApi);
    return;
  }
}

/**
 * 在嵌套对象中查找适配器
 */
function findNestedAdapter(
  sourceName: string,
  nestedMap: Record<string, any> | undefined,
): string | undefined {
  if (!nestedMap) return undefined;

  // 如果是字符串值，直接返回
  if (typeof nestedMap === 'string') {
    return nestedMap;
  }

  // 如果是对象，查找对应的适配器
  return nestedMap[sourceName];
}

/**
 * 处理需要依赖分析的 API（如 watchEffect, lifecycle）
 */
function handleDependencyAnalysisAPI(
  path: NodePath<t.CallExpression>,
  ctx: ICompilationContext,
  adapter: string,
  pkgName: string,
) {
  const { node } = path;
  const { arguments: args } = node;

  if (args.length === 0) return;

  const fn = args[0];
  if (!t.isArrowFunctionExpression(fn) && !t.isFunctionExpression(fn)) {
    return;
  }

  // 获取箭头函数/函数表达式的路径
  const fnPath = path.get('arguments')[0] as NodePath<t.Expression>;
  const deps = analyzeDeps(fn, ctx, fnPath);

  // 添加第二个参数，依赖项
  args.push(deps);

  replaceCallName(node, adapter);
  recordImport(ctx, pkgName, adapter);
}
