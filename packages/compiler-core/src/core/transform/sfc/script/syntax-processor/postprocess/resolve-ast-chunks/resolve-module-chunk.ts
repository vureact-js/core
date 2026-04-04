import { NodePath } from '@babel/traverse';
import * as t from '@babel/types';
import { ScriptBlockIR } from '../../..';
import { forkNode } from '../../../shared/babel-utils';

/**
 * 处理 import/export 语句的提取
 */
export function resolveModuleChunks(
  path: NodePath<t.ImportDeclaration | t.ExportDeclaration>,
  ir: ScriptBlockIR,
) {
  const forked = forkNode(path.node);

  if (t.isImportDeclaration(forked)) {
    ir.imports.push(forked);
  } else if (t.isExportDeclaration(forked)) {
    ir.exports.push(forked);
  }

  path.remove();
}
