import * as t from '@babel/types';
import { VuR_Runtime } from '@src/consts/runtimeModules';
import { CompileContextType } from '@src/shared/compile-context';
import { createElement } from '../shared';
import { JSXChild } from '../types';
import { buildJSXExpression } from './simple-builder';

export function buildCtxProvider(
  ctxProvider: CompileContextType['ctxProvider'],
  children: JSXChild[],
): t.JSXElement {
  const { name, value, ctxProvider: nextCtxProvider } = ctxProvider;

  let _children = children;

  if (nextCtxProvider?.exists) {
    // 链式倒序的递归构建 provider 组件的嵌套
    _children = [buildCtxProvider(nextCtxProvider as CompileContextType['ctxProvider'], children)];
  }

  const keyProp = t.jsxAttribute(t.jsxIdentifier('key'), buildJSXExpression(t.identifier(name)));

  const valueProp = t.jsxAttribute(
    t.jsxIdentifier('value'),
    buildJSXExpression(t.identifier(value)),
  );

  return createElement(VuR_Runtime.CtxProvider, [keyProp, valueProp], _children);
}
