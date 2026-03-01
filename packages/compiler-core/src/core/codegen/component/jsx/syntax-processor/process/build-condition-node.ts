import * as t from '@babel/types';
import { ICompilationContext } from '@compiler/context/types';
import { ElementNodeIR } from '@src/core/transform/sfc/template/syntax-processor/process';
import { JSXChild } from '../../types';
import { convertJsxChildToExpression } from '../../utils/jsx-expression-utils';
import { buildElementNode } from './build-element-node';
import { buildJsxExpressionNode } from './build-simple-node';

export function buildConditionNode(nodeIR: ElementNodeIR, ctx: ICompilationContext): JSXChild {
  // 获取条件节点元数据中的条件信息
  const condition = nodeIR.meta.condition!;

  // 获取条件链中的下一个节点（用于else分支）
  const nextNodeIR = condition.next;

  // 创建可变引用，用于标记处理状态
  const mutableNodeIR = nodeIR as ElementNodeIR & { __processing?: boolean };

  // 构建当前节点的函数
  const buildCurrentNode = () => buildElementNode(nodeIR, ctx)!;

  // 设置处理标志位
  const setFlags = () => {
    condition.isHandled = true; // 标记条件已处理
    nodeIR.conditionIsHandled = true; // 标记节点条件已处理
    mutableNodeIR.__processing = true; // 标记节点正在处理中
  };

  // 清除处理标志位
  const clearFlags = () => {
    delete mutableNodeIR.__processing;
  };

  // 开始处理前设置标志位
  setFlags();

  // 处理else分支：如果是else节点，直接构建当前节点
  if (condition.else) {
    const result = buildCurrentNode();
    clearFlags();
    return result;
  }

  // 获取条件表达式的AST
  const testExpression = condition.babelExp.ast;

  // 构建true分支（当前节点）
  const trueBranchExpression = convertJsxChildToExpression(buildCurrentNode());
  
  // 构建false分支：如果有下一个节点则构建，否则使用null字面量
  const falseBranchExpression = nextNodeIR
    ? convertJsxChildToExpression(buildElementNode(nextNodeIR, ctx)!)
    : t.nullLiteral();

  // 创建三元条件表达式
  const conditionalExpression = t.conditionalExpression(
    testExpression, // 条件测试部分
    trueBranchExpression, // true分支
    falseBranchExpression, // false分支
  );

  // 处理完成后清除标志位
  clearFlags();

  // 将条件表达式包装为JSX表达式节点
  return buildJsxExpressionNode(conditionalExpression);
}
