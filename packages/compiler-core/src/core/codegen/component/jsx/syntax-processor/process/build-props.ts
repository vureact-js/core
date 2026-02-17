import * as t from '@babel/types';
import { ICompilationContext } from '@compiler/context/types';
import { TemplateChildNodeIR } from '@src/core/transform/sfc/template';
import { PropTypes } from '@src/core/transform/sfc/template/shared/types';
import {
  ElementNodeIR,
  PropsIR,
  SlotPropsIR,
} from '@src/core/transform/sfc/template/syntax-processor/process';
import { JSXProp } from '../../types';
import { buildJsxExpressionNode } from './build-simple-node';
import { buildSlotProp } from './build-slot-prop';

export function buildProps(nodeIR: ElementNodeIR, ctx: ICompilationContext): JSXProp[] {
  const props: JSXProp[] = [];

  for (const propNodeIR of nodeIR.props) {
    if (propNodeIR.type === PropTypes.SLOT) {
      const slotProp = buildSlotProp(propNodeIR as SlotPropsIR, ctx);

      if (slotProp) {
        if (propNodeIR.name === 'children') {
          nodeIR.children = slotProp as unknown as TemplateChildNodeIR[];
        } else {
          props.push(slotProp as JSXProp);
        }
      }

      continue;
    }

    props.push(buildStandardProp(propNodeIR));
  }

  return props;
}

function buildStandardProp(nodeIR: PropsIR): JSXProp {
  const {
    isStatic,
    isKeyLessVBind,
    babelExp: { ast: keyAST },
    value: {
      content,
      isStringLiteral,
      babelExp: { ast: valueAST },
    },
  } = nodeIR;

  if (!isStatic || isKeyLessVBind) {
    return t.jsxSpreadAttribute(valueAST as t.Expression);
  }

  let value;

  if (content !== 'true') {
    value = isStringLiteral ? t.stringLiteral(content) : buildJsxExpressionNode(valueAST);
  }

  return t.jsxAttribute(keyAST as t.JSXIdentifier, value);
}
