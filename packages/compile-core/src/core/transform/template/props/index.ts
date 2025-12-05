import { RuntimeHelper } from '@core/transform/types';
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
    combines?: string | string[];
    /* 
     默认值 true。
     可通过 babel parseExpression 直接生成 ast node，
     如果包含需运行时辅助的则不可用。
    */
    isBabelParseExp: boolean;
  };
  /* 
   无参数 v-bind。
   生成阶段需配合 type 是否为动态属性，
   以及 name 是否为空、isKeyLessVBind 是否为 true，
   如果成立则创建jsx属性表达式 {...{value.content}}
  */
  isKeyLessVBind?: boolean;
}

export enum PropTypes {
  ATTRIBUTE = 1,
  DIRECTIVE = 2,
  SLOT = 3,
  EVENT = 4,
  DYNAMIC_ATTRIBUTE = 5,
}

export function transformProps(node: VueElementNode, nodeIR: ElementNodeIR) {
  for (const prop of node.props) {
    if (prop.type === NodeTypes.ATTRIBUTE) {
      handleAttribute(prop, nodeIR);
      continue;
    }

    if (prop.type === NodeTypes.DIRECTIVE) {
      const stop = handleDirective(node, prop, nodeIR);
      if (stop) break;
    }
  }
}
