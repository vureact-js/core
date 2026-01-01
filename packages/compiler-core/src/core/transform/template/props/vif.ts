import { compileContext } from '@shared/compile-context';
import { logger } from '@shared/logger';
import { DirectiveNode, SimpleExpressionNode } from '@vue/compiler-core';
import { ElementNodeIR } from '../elements/element';
import { resolveTemplateExp } from '../shared/resolve-str-exp';

export function handleVIf(
  prop: DirectiveNode,
  nodeIR: ElementNodeIR,
  nodesIR: ElementNodeIR[],
): boolean | void {
  const name = prop.name === 'else-if' ? 'elseIf' : prop.name;
  const value = (prop.exp as SimpleExpressionNode)?.content ?? 'true';

  const prevNode = nodesIR[nodesIR.length - 1];
  const isElseOrElseIf = name === 'else' || name === 'elseIf';

  let error = false;

  // 验证条件分支正确性
  if (isElseOrElseIf && prevNode) {
    // 查找同级的前一个点是否为 if 分支
    if (prevNode.meta.condition) {
      const { condition } = prevNode.meta;
      // 非 if & else-if 是错误的
      if (!condition.if && !condition.elseIf) {
        error = true;
      } else {
        // 将当前节点保存到前一个if/else if分支的next里
        prevNode!.meta.condition!.next = nodeIR;
      }
    } else {
      // if分支都没有
      error = true;
    }
  }

  if (error) {
    const { source, filename } = compileContext.context;
    logger.error('v-else/v-else-if has no adjacent v-if or v-else-if.', {
      source,
      file: filename,
      loc: prop.loc,
    });
    return error;
  }

  nodeIR.meta.condition = {
    isHandled: false,
    [name]: true,
    value,
    babelExp: {
      content: value,
      ast: resolveTemplateExp(value),
    },
  };
}
