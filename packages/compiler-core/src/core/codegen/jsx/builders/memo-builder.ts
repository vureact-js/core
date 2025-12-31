import { buildUseMemo } from '@src/core/codegen/script/builders/react-hook-builder';
import { ElementNodeIR } from '@src/core/transform/template/elements/element';
import { convertToExpression } from '../shared';
import { JSXChild } from '../types';
import { buildElement } from './element-builder';
import { buildJSXExpression } from './simple-builder';

export function buildMemo(nodeIR: ElementNodeIR): JSXChild {
  const memo = nodeIR.meta.memo!;

  memo.isHandled = true;

  // 构建 useMemo 调用
  const deps = memo!.babelExp.ast;
  const body = convertToExpression(buildElement(nodeIR)!);

  const useMemo = buildUseMemo(body, deps);

  return buildJSXExpression(useMemo);
}
