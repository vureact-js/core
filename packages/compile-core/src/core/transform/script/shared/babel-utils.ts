import { NodePath } from '@babel/traverse';
import * as t from '@babel/types';
import { ReactiveTypes, VarDeclKind } from './types';

export function getVarKind(path: NodePath<t.VariableDeclarator>): VarDeclKind {
  const {
    parentPath: { node },
  } = path;
  if (t.isVariableDeclaration(node)) {
    return node.kind;
  }
  return 'const';
}

export function isReferencedIdentifier(path: NodePath<t.Identifier>): boolean {
  // 排除作为属性名的标识符
  if (path.parentPath.isMemberExpression()) {
    return path.parentPath.node.object === path.node;
  }

  // 排除对象属性键名
  if (path.parentPath.isObjectProperty()) {
    return path.parentPath.node.value === path.node;
  }

  // 排除函数参数名
  if (path.parentPath.isFunction()) {
    return !path.parentPath.node.params.includes(path.node);
  }

  // 其他情况都认为是变量引用
  return true;
}

export function getRootIdentifier(
  path: NodePath<t.MemberExpression | t.OptionalMemberExpression>,
): NodePath<t.Identifier> | null {
  let currentNode: t.Expression = path.node;

  // 沿着 object 链向上查找，直到找到标识符
  while (t.isMemberExpression(currentNode) || t.isOptionalMemberExpression(currentNode)) {
    currentNode = currentNode.object;
  }

  // 如果最终找到的是标识符，返回对应的路径
  if (t.isIdentifier(currentNode)) {
    // 需要找到这个标识符的路径
    // 可以通过查找父节点链来找到它
    let currentPath: NodePath | null = path;

    while (currentPath && !(currentPath.isIdentifier() && currentPath.node === currentNode)) {
      if (
        t.isMemberExpression(currentPath.node) ||
        t.isOptionalMemberExpression(currentPath.node)
      ) {
        // 如果当前节点是 MemberExpression，检查它的 object
        if (currentPath.node.object === currentNode) {
          // 返回 object 的路径
          return currentPath.get('object') as NodePath<t.Identifier>;
        }
      }

      // 移动到父路径
      currentPath = currentPath.parentPath;
    }

    if (currentPath?.isIdentifier()) {
      return currentPath as NodePath<t.Identifier>;
    }
  }

  return null;
}

export interface BabelNodeExtensionMeta {
  isReactive?: boolean;
  reactiveType?: ReactiveTypes;
}

export function getNodeExtensionMeta(node: t.Node): BabelNodeExtensionMeta {
  return (node as any).__extensionMeta;
}

export function setNodeExtensionMeta(node: t.Node, opts: BabelNodeExtensionMeta) {
  opts.isReactive = opts.isReactive ?? true;
  opts.reactiveType = opts.reactiveType || 'ref';
  (node as any).__extensionMeta = opts;
}

export function checkIsCallExpInAnyCallback(path: NodePath<t.CallExpression>): boolean {
  let current = path.parentPath;

  while (current) {
    // 如果当前节点是一个函数
    if (
      current.isFunctionDeclaration() ||
      current.isFunctionExpression() ||
      current.isArrowFunctionExpression()
    ) {
      // 检查这个函数是否是某个调用表达式的参数
      const funcParent = current.parentPath;

      if (funcParent && funcParent.isCallExpression()) {
        const callExp = funcParent.node;

        // 检查这个函数是否是 callExp 的参数之一
        const isArgument = callExp.arguments.some((arg) => arg === current.node);

        if (isArgument) {
          return true;
        }
      }
    }

    // @ts-ignore 继续向上查找
    current = current.parentPath;
  }

  return false;
}
