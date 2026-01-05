import * as t from '@babel/types';
import { ReactApis } from '@src/consts/runtimeModules';
import { ElementNodeIR } from '@src/core/transform/template/elements/element';
import { convertToExpression } from '../shared';
import { JSXChild } from '../types';
import { buildElement } from './element-builder';
import { buildJSXExpression } from './simple-builder';

export function buildMemo(nodeIR: ElementNodeIR): JSXChild {
  const memo = nodeIR.meta.memo!;

  memo.isHandled = true;

  const deps = memo!.babelExp.ast;
  const body = convertToExpression(buildElement(nodeIR)!);

  const useMemo = t.callExpression(t.identifier(ReactApis.useMemo), [
    t.arrowFunctionExpression([], body),
    deps,
  ]);

  return buildJSXExpression(useMemo);
}
