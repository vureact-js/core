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
