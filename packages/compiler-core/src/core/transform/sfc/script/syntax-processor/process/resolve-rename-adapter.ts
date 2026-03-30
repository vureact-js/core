import { Binding, NodePath, TraverseOptions } from '@babel/traverse';
import * as t from '@babel/types';
import { ICompilationContext } from '@compiler/context/types';
import { ADAPTER_RULES } from '@consts/adapters-map';
import { PACKAGE_NAME, VUE_PACKAGES } from '@consts/other';
import { getReactiveType } from '@shared/reactive-utils';
import { recordImport } from '@transform/shared';
import {
  getVariableDeclaratorPath,
  replaceCallName,
  replaceIdName,
} from '../../shared/babel-utils';
import { setScriptNodeMeta } from '../../shared/metadata-utils';

/**
 * 处理“重命名型”适配规则。
 * 仅当标识符来自 Vue 生态 import 时才执行替换，
 * 避免把业务代码中的同名局部变量误判为 Vue API。
 */
export function resolveRenameAdapter(ctx: ICompilationContext): TraverseOptions {
  return {
    'CallExpression|Identifier'(path) {
      const node = path.node;
      const isCallNode = t.isCallExpression(node);

      let apiName = '';

      if (t.isIdentifier(node)) {
        apiName = node.name;
      } else if (isCallNode && t.isIdentifier(node.callee)) {
        apiName = node.callee.name;
      }

      if (!apiName) {
        return;
      }

      const runtimeAdapter = ADAPTER_RULES.runtime[apiName];
      const routerAdapter = ADAPTER_RULES.router[apiName];
      const adapter = runtimeAdapter || routerAdapter;

      if (!adapter || adapter.type !== 'rename') {
        return;
      }

      if (!isVueApiReference(path as NodePath<t.CallExpression | t.Identifier>, apiName)) {
        return;
      }

      if (adapter.isTrackable) {
        const reactiveType = getReactiveType(apiName);
        const declaratorPath = getVariableDeclaratorPath(path);

        setScriptNodeMeta(declaratorPath?.node, {
          is_reactive: true,
          reactive_type: reactiveType,
        });
      }

      if (isCallNode) {
        replaceCallName(node, adapter.target);
      } else {
        replaceIdName(node, adapter.target);
      }

      if (adapter.package === PACKAGE_NAME.router && !ctx.route) {
        ctx.route = true;
      }

      recordImport(ctx, adapter.package, adapter.target);
    },
  };
}

function isVueApiReference(path: NodePath<t.CallExpression | t.Identifier>, apiName: string): boolean {
  if (path.isIdentifier()) {
    // CallExpression 的 callee 由 CallExpression 分支统一处理，避免重复命中。
    if (path.parentPath.isCallExpression() && path.parentPath.node.callee === path.node) {
      return false;
    }

    // 只处理引用位标识符，排除声明位、对象 key、类型位等。
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