import * as t from '@babel/types';
import { ICompilationContext } from '@compiler/context/types';
import { ElementNodeIR } from '@transform/template/syntax-processor/process';
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

  const sourceIdentifier = t.identifier(source);

  const params: t.Identifier[] = [t.identifier(value)];
  if (index ?? key) {
    params.push(t.identifier((index ?? key)!));
  }

  const mapCallExpression = t.callExpression(
    t.memberExpression(sourceIdentifier, t.identifier('map')),
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

  const sourceIdentifier = t.identifier(source);
  const objectEntriesCallExpression = t.callExpression(
    t.memberExpression(t.identifier('Object'), t.identifier('entries')),
    [sourceIdentifier],
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
