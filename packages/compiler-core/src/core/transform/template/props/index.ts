import { Expression, JSXIdentifier } from '@babel/types';
import { ICompilationContext } from '@compiler/context/types';
import { STYLE_MODULE_NAME } from '@consts/other';
import { DirectiveNode, NodeTypes, ElementNode as VueElementNode } from '@vue/compiler-core';
import { ElementNodeIR } from '../elements/element';
import { BabelExp } from '../shared/types';
import { handleAttribute } from './attributes';
import { handleDirective } from './directives';

export interface PropsIR {
  type: PropTypes;
  rawName?: string;
  name: string;
  isStatic?: boolean;
  modifiers?: string[];
  value: PropIRValue;
  isKeyLessVBind?: boolean;
  babelExp: BabelExp<JSXIdentifier | Expression>;
}

export enum PropTypes {
  ATTRIBUTE = 1,
  SLOT = 2,
  EVENT = 3,
  DYNAMIC_ATTRIBUTE = 4,
}

export type PropIRValue = {
  content: string;
  isStringLiteral?: boolean;
  merge?: string[];
  babelExp: BabelExp;
};

export function transformProps(
  ctx: ICompilationContext,
  node: VueElementNode,
  nodeIR: ElementNodeIR,
  nodesIR: ElementNodeIR[],
) {
  for (const prop of node.props) {
    if (prop.type === NodeTypes.ATTRIBUTE) {
      handleAttribute(ctx, prop, nodeIR);
      continue;
    }

    if (prop.type === NodeTypes.DIRECTIVE) {
      // 替换 $style.xxx -> styleModule.xxx
      normalizeDefaultStyleModuleName(prop);

      const stop = handleDirective(ctx, node, prop, nodeIR, nodesIR);

      if (stop) break;
    }
  }
}

function normalizeDefaultStyleModuleName(prop: DirectiveNode) {
  const { exp } = prop;

  if (exp?.type !== NodeTypes.SIMPLE_EXPRESSION) {
    return;
  }

  // 使用 $style 的情况必然是 <style module>
  // 这种情况必须替换成 styleModule
  if (exp.content.includes('$style')) {
    const newContent = exp.content.replaceAll('$style', STYLE_MODULE_NAME);
    exp.content = newContent;
  }
}
