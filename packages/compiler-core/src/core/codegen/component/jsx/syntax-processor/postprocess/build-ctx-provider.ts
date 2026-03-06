import * as t from '@babel/types';
import { ICompilationContext, ProvideData } from '@compiler/context/types';
import { ADAPTER_RULES } from '@consts/adapters-map';
import { VUE_API_MAP } from '@consts/vue-api-map';
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

  const keyProp = t.jsxAttribute(
    t.jsxIdentifier('key'),
    buildJsxExpressionNode(t.identifier(name)),
  );

  const valueProp = t.jsxAttribute(
    t.jsxIdentifier('value'),
    buildJsxExpressionNode(t.identifier(value)),
  );

  void ctx;

  const adpater = ADAPTER_RULES.runtime[VUE_API_MAP.provide]!;
  return createJsxElement(adpater.target, [keyProp, valueProp], childNodes);
}
