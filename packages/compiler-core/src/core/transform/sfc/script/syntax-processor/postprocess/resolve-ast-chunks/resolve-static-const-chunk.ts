import { NodePath } from '@babel/traverse';
import * as t from '@babel/types';
import { ScriptBlockIR } from '../../..';
import { forkNode, isSimpleLiteral, isVariableDeclTopLevel } from '../../../shared/babel-utils';
import { getScriptNodeMeta } from '../../../shared/metadata-utils';

/**
 * 处理顶层常量声明语句的提取
 */
export function resolveStaticConstChunks(path: NodePath<t.VariableDeclarator>, ir: ScriptBlockIR) {
  const { node, parentPath } = path;
  const parent = parentPath.node as t.VariableDeclaration;

  // 当值为简单字面量且不为响应式时候

  if (
    !isVariableDeclTopLevel(path) ||
    !parentPath.isVariableDeclaration() ||
    parent.kind !== 'const' ||
    !isSimpleLiteral(node.init) ||
    getScriptNodeMeta(node)
  ) {
    return;
  }

  const forked = forkNode(parent);
  ir.statement.global.push(forked);

  parentPath.remove();
}
