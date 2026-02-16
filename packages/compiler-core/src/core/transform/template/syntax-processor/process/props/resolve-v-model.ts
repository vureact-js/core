import { ICompilationContext } from '@compiler/context/types';
import { TemplateBlockIR } from '@transform/template';
import { createPropsIR, resolvePropAsBabelExp } from '@transform/template/shared/prop-ir-utils';
import { capitalize } from '@utils/capitalize';
import {
  AttributeNode,
  DirectiveNode,
  ElementTypes,
  NodeTypes,
  SimpleExpressionNode,
  ElementNode as VueElementNode,
} from '@vue/compiler-core';
import { ElementNodeIR } from '../resolve-element-node';
import { PropsIR } from './resolve-props';

type HTMLInputType = 'text' | 'checkbox' | 'radio' | 'select' | 'textarea';

export function resolveVModel(
  node: DirectiveNode,
  _ir: TemplateBlockIR,
  ctx: ICompilationContext,
  elementNode: VueElementNode,
  nodeIR: ElementNodeIR,
) {
  const arg = node.arg as SimpleExpressionNode;
  const exp = node.exp as SimpleExpressionNode;

  const getterName = exp.content;
  const isComponent = elementNode.tagType === ElementTypes.COMPONENT;
  const inputType = resolveHtmlInput(elementNode, isComponent);
  const propName = arg?.content ?? resolveModelPropName(inputType, isComponent);

  const propsIR = createPropsIR('v-model', propName, getterName);
  const eventIR = createVModelEventIR(ctx, getterName);

  resolvePropAsBabelExp(propsIR, ctx);
  resolvePropAsBabelExp(eventIR, ctx);

  nodeIR.props.push(propsIR, eventIR);
}

function resolveModelPropName(inputType?: HTMLInputType, isComponent = false): string {
  if (inputType === 'checkbox' || inputType === 'radio') {
    return 'checked';
  }

  return !isComponent ? 'value' : 'modelValue';
}

function createVModelEventIR(ctx: ICompilationContext, getterName: string): PropsIR {
  const getterNamespace = getRootIdName(getterName)!;

  const propName = `onUpdate${capitalize(getterNamespace)}`;
  const rawName = `update:${getterNamespace}`;

  const isTS = ctx.scriptData.lang.startsWith('ts');
  const valueArg = isTS ? 'value:any' : 'value';

  // Emit an inline assignment handler for v-model updates.
  const inlineAssignFn = `(${valueArg})=>{${getterName}=value}`;

  return createPropsIR(rawName, propName, inlineAssignFn);
}

function resolveHtmlInput(node: VueElementNode, isComponent: boolean): HTMLInputType | undefined {
  if (isComponent) return;

  if (node.tag !== 'input') return node.tag as HTMLInputType;

  const typeProp = node.props.find(
    (prop) => prop.type === NodeTypes.ATTRIBUTE && prop.name === 'type',
  ) as AttributeNode | undefined;

  return typeProp?.value?.content.toLowerCase() as HTMLInputType;
}

function getRootIdName(expr: string): string | undefined {
  if (typeof expr !== 'string') return;

  const pattern = /^([a-zA-Z_$][a-zA-Z0-9_$]*)(?:[\.\?\.\[\(].*)?$/;
  const match = pattern.exec(expr.trim());

  return match?.[1];
}
