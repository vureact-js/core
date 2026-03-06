import { TraverseOptions } from '@babel/traverse';
import * as t from '@babel/types';
import { ICompilationContext } from '@compiler/context/types';
import { ADAPTER_RULES } from '@consts/adapters-map';
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
export function resolveRenameAdapter(ctx: ICompilationContext): TraverseOptions {
  return {
    'CallExpression|Identifier'(path) {
      const node = path.node;
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

      // 从适配器规则中查找对应的运行时适配器和路由适配器
      const runtimeAdapter = ADAPTER_RULES.runtime[apiName];
      const routerAdapter = ADAPTER_RULES.router[apiName];

      // 优先使用运行时适配器，若不存在则使用路由适配器
      const adapter = runtimeAdapter || routerAdapter;

      // 如果未找到适配器或适配器类型不是重命名类型，则直接返回，不进行处理
      if (!adapter || adapter.type !== 'rename') {
        return;
      }

      // 如果适配器标记为可追踪，则进行响应式元数据设置
      if (adapter.isTrackable) {
        // 获取当前 API 的响应式类型
        const reactiveType = getReactiveType(apiName);
        // 获取当前路径对应的变量声明节点路径
        const declaratorPath = getVariableDeclaratorPath(path);

        // 在变量声明节点上设置元数据，标记为响应式并记录响应式类型
        setScriptNodeMeta(declaratorPath?.node, {
          is_reactive: true,
          reactive_type: reactiveType,
        });
      }

      // 根据节点类型进行名称替换
      // 如果是调用表达式，替换调用名称
      if (isCallNode) {
        replaceCallName(node, adapter.target);
      } else {
        // 否则是标识符节点，替换标识符名称
        replaceIdName(node, adapter.target);
      }

      // 如果适配器属于路由包且编译上下文中尚未标记路由，则标记路由已使用
      if (adapter.package === PACKAGE_NAME.router && !ctx.route) {
        ctx.route = true;
      }

      recordImport(ctx, adapter.package, adapter.target);
    },
  };
}
