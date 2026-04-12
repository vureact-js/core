import { PropTypes } from '@transform/sfc/template/shared/types';
import { ElementNodeIR } from '@transform/sfc/template/syntax-processor/process';
import { JSXChild } from '../../../types';
import { buildFragmentNode } from '../build-simple-node';

/**
 * 处理携带控制/插槽指令的 template 节点
 */
export function resolveTemplateNode(
  nodeIR: ElementNodeIR,
  children: JSXChild[],
): JSXChild | undefined {
  const hasCondition = !!nodeIR.meta?.condition;
  const hasLoop = !!nodeIR.meta?.loop?.isLoop;
  const hasSlot = nodeIR.props.some((p: any) => p.type === PropTypes.SLOT);

  // 仅当 <template> 携带控制/插槽指令
  // （v-if|v-else|v-else-if|v-for|v-slot）时，才解包为子节点。
  if (hasCondition || hasLoop || hasSlot) {
    // 无子节点 => 空 Fragment；
    if (!children.length) {
      return buildFragmentNode([]);
    }

    // 单子节点直接返回；
    if (children.length === 1) {
      return children[0] as JSXChild;
    }

    // 多个子节点用 Fragment 包裹
    return buildFragmentNode(children);
  }

  // 对于普通无指令的 <template>，保留为真实的 <template> 元素输出以保持语义一致性。
}
