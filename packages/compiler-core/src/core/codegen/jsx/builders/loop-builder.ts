import * as t from '@babel/types';
import { ICompilationContext } from '@compiler/context/types';
import { ElementNodeIR } from '@src/core/transform/template/elements/element';
import { convertToExpression } from '../shared';
import { JSXChild } from '../types';
import { buildElement } from './element-builder';
import { buildJSXExpression } from './simple-builder';

export function buildLoop(ctx: ICompilationContext, nodeIR: ElementNodeIR): JSXChild {
  const loop = nodeIR.meta.loop!;

  loop.isHandled = true;

  // 判断是数组遍历还是对象遍历
  const isObjectTraversal = loop.value.index && loop.value.key;

  const result = isObjectTraversal
    ? // 对象遍历 - 使用 Object.entries 或 Object.keys
      buildObjectLoop(ctx, nodeIR)
    : // 数组遍历
      buildArrayLoop(ctx, nodeIR);

  return result;
}

function buildArrayLoop(ctx: ICompilationContext, nodeIR: ElementNodeIR): JSXChild {
  const loop = nodeIR.meta.loop!;
  const { source, value, index, key } = loop.value;

  // 构建 map 调用的源
  const sourceIdentifier = t.identifier(source);

  // 构建回调函数参数
  const params: t.Identifier[] = [t.identifier(value)];
  if (index ?? key) {
    params.push(t.identifier((index ?? key)!));
  }

  // 构建 map 调用
  const mapCall = t.callExpression(t.memberExpression(sourceIdentifier, t.identifier('map')), [
    t.arrowFunctionExpression(params, convertToExpression(buildElement(ctx, nodeIR)!)),
  ]);

  return buildJSXExpression(mapCall);
}

function buildObjectLoop(ctx: ICompilationContext, nodeIR: ElementNodeIR): JSXChild {
  const loop = nodeIR.meta.loop!;
  const { source, value, key, index } = loop.value;

  // 对于对象遍历，使用 Object.entries
  const sourceIdentifier = t.identifier(source);
  const objectEntries = t.callExpression(
    t.memberExpression(t.identifier('Object'), t.identifier('entries')),
    [sourceIdentifier],
  );

  // 构建回调函数参数
  const params: (t.Identifier | t.ArrayPattern)[] = [
    t.arrayPattern([t.identifier(key || 'key'), t.identifier(value)]),
  ];

  if (index) {
    params.push(t.identifier(index));
  }

  // 构建 map 调用
  const mapCall = t.callExpression(t.memberExpression(objectEntries, t.identifier('map')), [
    t.arrowFunctionExpression(params, convertToExpression(buildElement(ctx, nodeIR)!)),
  ]);

  return buildJSXExpression(mapCall);
}
