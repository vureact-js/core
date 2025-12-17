import { NodePath } from '@babel/traverse';
import * as t from '@babel/types';
import { compileContext } from '@shared/compile-context';
import { logger } from '@shared/logger';
import { VarDeclKind } from '../types';

export function getVarKind(path: NodePath<t.VariableDeclarator>): VarDeclKind {
  const {
    parentPath: { node },
  } = path;
  if (t.isVariableDeclaration(node)) {
    return node.kind;
  }
  return 'const';
}

export function checkNodeIsInBlock(path: NodePath): boolean {
  // 1. 检查是否在块语句中（如 if、for、while 等）
  const inBlock = path.findParent((p) => t.isBlockStatement(p.node) && !t.isFunction(p.parent));
  const { source, filename } = compileContext.context;

  if (inBlock) {
    logger.warn(
      'Hooks cannot be used inside conditional statements, loops, switch cases, or try-catch blocks.',
      {
        source,
        file: filename,
        loc: path.node.loc!,
      },
    );
    return false;
  }

  return true;
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