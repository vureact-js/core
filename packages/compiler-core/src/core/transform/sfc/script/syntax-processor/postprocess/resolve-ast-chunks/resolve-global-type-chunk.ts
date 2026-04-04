import { NodePath } from '@babel/traverse';
import * as t from '@babel/types';
import { ScriptBlockIR } from '../../..';
import { forkNode } from '../../../shared/babel-utils';

/**
 * 处理 TS 全局类型声明语句的提取
 */
export function resolveGlobalTypeChunks(path: NodePath<t.TypeScript>, ir: ScriptBlockIR) {
  if (!path.parentPath?.isProgram()) {
    return;
  }

  const forked = forkNode(path.node) as t.TypeScript;
  ir.tsTypes.push(forked);

  path.remove();
}
