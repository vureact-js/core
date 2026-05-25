import { NodePath, TraverseOptions } from '@babel/traverse';
import * as t from '@babel/types';
import { ICompilationContext } from '@compiler/context/types';
import { VUE_PACKAGES } from '@consts/other';
import { replaceNode } from '../../shared/babel-utils';

/**
 * 处理所有从 Vue 包导入的类型引用，统一替换为 any 兜底
 */
export function resolveVueTypeAsAny(ctx: ICompilationContext): TraverseOptions {
  return {
    TSTypeReference(path) {
      // fix: https://github.com/vureact-js/core/issues/47
      if (isVueTypeRef(path)) {
        replaceNode(path, t.tsAnyKeyword(), path.node);
      }
    },
  };
}

/**
 * 检查 TSTypeReference 是否指向从 Vue 包导入的类型
 */
function isVueTypeRef(path: NodePath<t.TSTypeReference>): boolean {
  const id = resolveTypeNameId(path.node.typeName);
  return id !== null && isVueImport(id, path);
}

/**
 * 从类型名称节点中提取根标识符（支持 a.b.c 嵌套形式）
 *
 * 例如：
 *   `Vue` → `Vue`
 *   `Vue.VNode` → `Vue`
 *   `Ns.Vue.VNode` → `Ns`
 */
function resolveTypeNameId(typeName: t.TSTypeReference['typeName']): t.Identifier | null {
  if (t.isIdentifier(typeName)) {
    return typeName;
  }

  if (t.isTSQualifiedName(typeName)) {
    let node: t.TSQualifiedName | t.Identifier = typeName;
    while (t.isTSQualifiedName(node)) {
      node = node.left;
    }
    return t.isIdentifier(node) ? node : null;
  }

  return null;
}

/**
 * 检测标识符是否来自 Vue 相关包的 import 声明
 */
function isVueImport(id: t.Identifier, path: NodePath): boolean {
  const binding = path.scope.getBinding(id.name);
  if (!binding) return false;

  const bp = binding.path;
  if (!bp.isImportSpecifier() && !bp.isImportDefaultSpecifier()) {
    return false;
  }

  const importDecl = bp.parentPath;
  if (!importDecl.isImportDeclaration()) {
    return false;
  }

  const moduleName: string = importDecl.node.source.value;
  return VUE_PACKAGES.some((pkg) => moduleName.includes(pkg));
}
