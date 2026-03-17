import * as t from '@babel/types';
import { ICompilationContext } from '@compiler/context/types';
import { resolveStringExpr } from '@src/core/transform/sfc/template/shared/resolve-string-expression';
import { ElementNodeIR } from '@src/core/transform/sfc/template/syntax-processor/process';
import { JSXChild } from '../../types';
import { convertJsxChildToExpression } from '../../utils/jsx-expression-utils';
import { buildElementNode } from './build-element-node';
import { buildJsxExpressionNode } from './build-simple-node';

export function buildLoopNode(nodeIR: ElementNodeIR, ctx: ICompilationContext): JSXChild {
  const loop = nodeIR.meta.loop!;

  loop.isHandled = true;

  const isObjectTraversal = loop.value.index && loop.value.key;

  return isObjectTraversal ? buildObjectLoopNode(nodeIR, ctx) : buildArrayLoopNode(nodeIR, ctx);
}

function buildArrayLoopNode(nodeIR: ElementNodeIR, ctx: ICompilationContext): JSXChild {
  const loop = nodeIR.meta.loop!;
  const { source, value, index, key } = loop.value;

  // fix: 修复属于 ref 类型的 API 变量访问没有补上 .value
  // 如 list.map => list.value.map
  const sourceExpression = resolveStringExpr(source, ctx);

  const params: t.Identifier[] = [t.identifier(value)];
  if (index ?? key) {
    params.push(t.identifier((index ?? key)!));
  }

  const mapCallExpression = t.callExpression(
    t.memberExpression(sourceExpression, t.identifier('map')),
    [
      t.arrowFunctionExpression(
        params,
        convertJsxChildToExpression(buildElementNode(nodeIR, ctx)!),
      ),
    ],
  );

  return buildJsxExpressionNode(mapCallExpression);
}

function buildObjectLoopNode(nodeIR: ElementNodeIR, ctx: ICompilationContext): JSXChild {
  const loop = nodeIR.meta.loop!;
  const { source, value, key, index } = loop.value;

  // fix: 修复属于 ref 类型的 API 变量访问没有补上 .value
  const sourceExpression = resolveStringExpr(source, ctx);

  const objectEntriesCallExpression = t.callExpression(
    t.memberExpression(t.identifier('Object'), t.identifier('entries')),
    [sourceExpression],
  );

  const params: (t.Identifier | t.ArrayPattern)[] = [
    t.arrayPattern([t.identifier(key || 'key'), t.identifier(value)]),
  ];

  if (index) {
    params.push(t.identifier(index));
  }

  const mapCallExpression = t.callExpression(
    t.memberExpression(objectEntriesCallExpression, t.identifier('map')),
    [
      t.arrowFunctionExpression(
        params,
        convertJsxChildToExpression(buildElementNode(nodeIR, ctx)!),
      ),
    ],
  );

  return buildJsxExpressionNode(mapCallExpression);
}
