import { ICompilationContext } from '@compiler/context/types';
import { PropTypes } from '@transform/sfc/template/shared/types';
import { ElementNodeIR, PropsIR, SlotPropsIR } from '../process';

export function resolveRouterLinkRules(nodeIR: ElementNodeIR, ctx: ICompilationContext) {
  // 将 props 写法 <router-link custom v-slot={...} /> 处理成
  // <RouterLink customRender={(...) => xxx} />

  nodeIR.props = nodeIR.props.filter((prop) => !isRouterLinkBooleanCustomProp(prop));

  const slotProp = nodeIR.props.find((prop): prop is SlotPropsIR => isRouterLinkSlotProp(prop));
  if (!slotProp) return;

  if (slotProp.name === 'children') {
    slotProp.name = 'customRender';
  }

  if (!slotProp.isScoped) {
    slotProp.isScoped = true;
    slotProp.callback = {
      arg: '',
      exp: slotProp.content ?? [],
    };
    slotProp.content = undefined;
  }

  if (!slotProp.callback) {
    slotProp.callback = {
      arg: '',
      exp: [],
    };
  }

  if (!slotProp.callback.exp.length && nodeIR.children.length) {
    slotProp.callback.exp = [...nodeIR.children];
    nodeIR.children = [];
  }
}

function isRouterLinkSlotProp(prop: PropsIR | SlotPropsIR): prop is SlotPropsIR {
  return prop.type === PropTypes.SLOT && (prop.name === 'children' || prop.name === 'customRender');
}

function isRouterLinkBooleanCustomProp(prop: PropsIR | SlotPropsIR): prop is PropsIR {
  if (prop.type === PropTypes.SLOT) {
    return false;
  }

  return prop.name === 'custom' && prop.isStatic === true && prop.value.content === 'true';
}
