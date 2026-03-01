import * as t from '@babel/types';
import { ICompilationContext } from '@compiler/context/types';
import { TemplateChildNodeIR } from '@src/core/transform/sfc/template';
import {
  BaseSimpleNodeIR,
  InterpNodeIR,
} from '@src/core/transform/sfc/template/shared/node-ir-utils';
import { NodeTypes } from '@src/core/transform/sfc/template/shared/types';
import { ElementNodeIR } from '@src/core/transform/sfc/template/syntax-processor/process';
import { JSXChild } from '../../types';
import { convertJsxChildToExpression } from '../../utils/jsx-expression-utils';
import { buildElementNode } from './build-element-node';
import { buildJsxChildren } from './build-jsx-children';
import { buildFragmentNode, buildJsxExpressionNode, buildTextNode } from './build-simple-node';

export function buildJsxNode(
  nodeIR: TemplateChildNodeIR | t.Node,
  ctx: ICompilationContext,
): JSXChild | null {
  // 如果已经是 Babel AST 节点，直接返回
  if (t.isNode(nodeIR)) {
    return nodeIR as JSXChild;
  }

  const simpleNodeIR = nodeIR as unknown as BaseSimpleNodeIR;

  // 处理文本节点
  if (nodeIR.type === NodeTypes.TEXT) {
    return buildTextNode(simpleNodeIR.content);
  }

  // 处理注释节点：转换为 JSX 表达式
  if (nodeIR.type === NodeTypes.COMMENT) {
    return buildJsxExpressionNode(simpleNodeIR.babelExp);
  }

  // 处理插值节点
  if (nodeIR.type === NodeTypes.JSX_INTERPOLATION) {
    const interpolationNodeIR = nodeIR as InterpNodeIR;
    const fallbackIR = interpolationNodeIR.meta?.slotWithDefault ?? [];

    // 如果插值节点带有 slotWithDefault 元数据，需要生成带默认值的逻辑表达式
    if (fallbackIR.length) {
      const fallbackChildren = buildJsxChildren(fallbackIR, ctx);

      // 默认内容为空时，直接返回插值表达式
      if (!fallbackChildren.length) {
        return buildJsxExpressionNode(interpolationNodeIR.babelExp);
      }

      // 将默认内容转换为表达式：多个节点用 Fragment 包裹，单个节点直接转换
      const fallbackExpression = convertJsxChildToExpression(
        fallbackChildren.length > 1 ? buildFragmentNode(fallbackChildren) : fallbackChildren[0]!,
      );

      // 生成逻辑表达式：插值表达式 ?? 默认内容表达式
      return buildJsxExpressionNode(
        t.logicalExpression('??', interpolationNodeIR.babelExp, fallbackExpression),
      );
    }

    // 没有默认内容时，直接返回插值表达式
    return buildJsxExpressionNode(interpolationNodeIR.babelExp);
  }

  // 处理 Fragment 节点：构建子节点并用 Fragment 包裹
  if (nodeIR.type === NodeTypes.FRAGMENT) {
    const fragmentNodeIR = nodeIR as unknown as ElementNodeIR;
    return buildFragmentNode(buildJsxChildren(fragmentNodeIR.children, ctx));
  }

  // 处理普通元素节点
  if (nodeIR.type === NodeTypes.ELEMENT) {
    return buildElementNode(nodeIR as ElementNodeIR, ctx);
  }

  // 未知节点类型返回 null
  return null;
}
