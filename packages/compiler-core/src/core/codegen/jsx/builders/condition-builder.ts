import * as t from '@babel/types';
import { ElementNodeIR } from '@core/transform/template/elements/node';
import { convertToExpression } from '../shared';
import { JSXChild } from '../types';
import { buildElement } from './element-builder';
import { buildJSXExpression } from './simple-builder';

export function buildCondition(nodeIR: ElementNodeIR): JSXChild {
  const condition = nodeIR.meta.condition!;
  const nextNode = condition.next;

  const buildEl = () => buildElement(nodeIR)!;

  const setFlag = () => {
    // 标记条件已处理，防止无限递归
    condition.isHandled = true;

    // 标记该节点已处理，防止后续 buildChildren 重复生成同一条件链的节点
    nodeIR.isHandled = true;

    // 标记正在处理，允许自身在构建过程中被递归调用（避免被 element-builder 跳过）
    (nodeIR as any).__processing = true;
  };

  const clearFlag = () => {
    // 构建完成后清理 processing 标志
    delete (nodeIR as any).__processing;
  };

  setFlag();

  if (condition.else) {
    const res = buildEl();
    clearFlag();
    return res;
  }

  /*
   * 构建 jsx 三元表达式: condition.babelExp.ast ? buildElement(nodeIR) : null，
   * null 作为占位保留项。
   * 若下一个节点为 condition.elseIf / condition.else，
   * 则 null 替换为 buildElement(nextNode)。
   * 不检查条件链式是否正确，transform 阶段已检查过。
   */

  const test = condition.babelExp.ast;
  const trueBranch = convertToExpression(buildEl());
  const falseBranch = nextNode ? convertToExpression(buildElement(nextNode)!) : t.nullLiteral();

  // 构建三元表达式
  const conditionalExp = t.conditionalExpression(test, trueBranch, falseBranch);

  clearFlag();

  return buildJSXExpression(conditionalExp);
}
