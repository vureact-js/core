import { RuntimeHelper } from '@src/types/runtimeHepler';
import { NodeTypes, ElementNode as VueElementNode } from '@vue/compiler-core';
import { ElementNodeIR } from '../nodes/element';
import { handleAttribute } from './attributes';
import { handleDirective } from './directives';

export interface PropsIR extends RuntimeHelper {
  type: PropTypes;
  rawName?: string;
  name: string;
  /*
   非静态键需生成 jsx 对象展开运算符： {...{[name]: value}}
  */
  isStatic?: boolean;
  modifiers?: string[];
  // 事件绑定
  value: {
    content: string;
    /* 临时存储合并项 */
    merge?: string[];
    /* 
     默认值 true。
     可通过 babel parseExpression 直接生成 ast node，
     如果包含需运行时辅助的则不可用。
    */
    isBabelParseExp: boolean;
  };
  /* 
   无参数的 v-bind={...}，需运行时 vBind 处理
  */
  isKeyLessVBind?: boolean;
}

export enum PropTypes {
  ATTRIBUTE = 1,
  SLOT = 2,
  EVENT = 3,
  DYNAMIC_ATTRIBUTE = 4,
}

export function transformProps(
  node: VueElementNode,
  nodeIR: ElementNodeIR,
  nodesIR: ElementNodeIR[],
) {
  for (const prop of node.props) {
    if (prop.type === NodeTypes.ATTRIBUTE) {
      handleAttribute(prop, nodeIR);
      continue;
    }

    if (prop.type === NodeTypes.DIRECTIVE) {
      const stop = handleDirective(node, prop, nodeIR, nodesIR);
      if (stop) break;
    }
  }
}
