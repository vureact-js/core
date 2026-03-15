import * as t from '@babel/types';
import { ICompilationContext, ProvideData } from '@compiler/context/types';
import { ADAPTER_RULES } from '@consts/adapters-map';
import { VUE_API_MAP } from '@consts/vue-api-map';
import { stringToExpr } from '@shared/babel-utils';
import { JSXChild } from '../../types';
import { createJsxElement } from '../../utils/jsx-element-utils';
import { buildJsxExpressionNode } from '../process';

export function buildCtxProviderNode(
  nodeIR: ProvideData,
  ctx: ICompilationContext,
  children: JSXChild[],
): t.JSXElement {
  const { name, value, provide: nextProvide } = nodeIR;

  let childNodes = children;

  if (nextProvide?.isOccupied) {
    childNodes = [buildCtxProviderNode(nextProvide as ProvideData, ctx, children)];
  }

  // Provider 组件使用 name/value 属性，不应误用 React 的 key 属性
  const parseProviderExpr = (raw?: string): t.Expression => {
    if (!raw) return t.stringLiteral('');

    try {
      return stringToExpr(raw, ctx.scriptData.lang, ctx.filename);
    } catch {
      // 解析失败时降级为字符串字面量，确保生成结果可运行
      return t.stringLiteral(raw);
    }
  };

  const nameProp = t.jsxAttribute(
    t.jsxIdentifier('name'),
    buildJsxExpressionNode(parseProviderExpr(name)),
  );

  const valueProp = t.jsxAttribute(
    t.jsxIdentifier('value'),
    buildJsxExpressionNode(parseProviderExpr(value)),
  );

  void ctx;

  const adpater = ADAPTER_RULES.runtime[VUE_API_MAP.provide]!;
  return createJsxElement(adpater.target, [nameProp, valueProp], childNodes);
}
