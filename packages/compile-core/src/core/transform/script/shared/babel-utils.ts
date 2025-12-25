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

export function getRootIdByMemberNodePath(
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

export function getRootIdByNode(node: t.Node): t.Identifier | null {
  // 获取表达式中访问的根标识符
  let rootId: t.Identifier | null = null;

  if (t.isIdentifier(node)) {
    rootId = node;
  } else if (t.isMemberExpression(node) || t.isOptionalMemberExpression(node)) {
    // 遍历获取根标识符
    let current: t.Expression = node;
    while (t.isMemberExpression(current) || t.isOptionalMemberExpression(node)) {
      current = (current as t.MemberExpression).object;
    }
    if (t.isIdentifier(current)) {
      rootId = current;
    }
  }

  return rootId;
}

export interface BabelNodeExtensionMeta {
  isReactive?: boolean;
  reactiveType?: ReactiveTypes;
  getterName?: string;
  setterName?: string;
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

export function isVariableDeclTopLevel(path: NodePath<t.Node>): boolean {
  const variableDeclaratorPath = path;
  const variableDeclarationPath = variableDeclaratorPath.parentPath;

  if (!variableDeclarationPath) {
    return false;
  }
  
  if (variableDeclarationPath.isProgram()) {
    return true;
  }

  const variableDeclarationParentPath = variableDeclarationPath.parentPath;

  // 变量声明在 Program 下
  if (variableDeclarationParentPath && variableDeclarationParentPath.isProgram()) {
    return true;
  }

  return false;
}
