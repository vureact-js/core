import * as t from '@babel/types';
import { ProvideData } from '@compiler/context/types';
import { VuR_Runtime } from '@src/consts/runtimeModules';
import { createElement } from '../shared';
import { JSXChild } from '../types';
import { buildJSXExpression } from './simple-builder';

export function buildCtxProvider(provide: ProvideData, children: JSXChild[]): t.JSXElement {
  const { name, value, provide: nextProvide } = provide;

  let childNodes = children;

  // 自下而上递归构建 provider 组件，形成正确的层级嵌套
  // provide(n1, ''); provide(n2, '');
  // 构建：
  // <CtxProvider name="n1">
  //   <CtxProvider name="n2">...<CtxProvider>
  // </CtxProvider>
  if (nextProvide?.isOccupied) {
    childNodes = [buildCtxProvider(nextProvide as ProvideData, children)];
  }

  const keyProp = t.jsxAttribute(t.jsxIdentifier('key'), buildJSXExpression(t.identifier(name)));

  const valueProp = t.jsxAttribute(
    t.jsxIdentifier('value'),
    buildJSXExpression(t.identifier(value)),
  );

  return createElement(VuR_Runtime.CtxProvider, [keyProp, valueProp], childNodes);
}
