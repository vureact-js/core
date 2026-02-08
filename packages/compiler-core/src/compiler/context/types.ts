import * as t from '@babel/types';
import { LangType } from '@shared/babel-utils';

export interface ICompilationContext {
  fileId: string;
  source: string;
  /** 函数组件名 */
  funcName: string;
  filename: string;
  imports: Map<string, ImportItem[]>;
  cssVars: string[];

  templateData: {
    lang?: string;
    /** 用于收集节点的 ref 属性值 */
    refs: Set<string>;
    /** 用于描述 `<slot>` / `<slot name="" ...props>` */
    slots: Record<string, SlotNodesContext>;
    /** 用于描述 v-model 对应 React 的事件处理函数 */
    models: IRModelEventHandler[];
  };

  scriptData: {
    lang: LangType;
    /** 用于收集 Vue 的 `provide(name, value)` */
    provide: ProvideData;
    propsTSIface: IPropsContext;
    source: string;
  };

  styleData: {
    filePath: string;
    /** style module 的名称  */
    moduleName?: string;
    /** style scoped 对应 id */
    scopeId?: string;
  };
}

export type ImportItem = { name: string; onDemand: boolean };

export interface SlotNodesContext {
  name: string;
  isScope: boolean;
  props: { prop: string; value: string; tsType: t.TSTypeAnnotation }[];
}

export interface IRModelEventHandler {
  key: string;
  handler: {
    /** 函数名 */
    name: string;
    /** 对应 v-model 的用于处理数据更新的函数表达式 */
    exp: {
      /** 函数参数 */
      arg: string;
      /** 函数体 */
      body: {
        /** 处理数据更新的 setter 函数表达式 */
        setterExp: {
          /** setter 函数名 */
          name: string;
          /** setter 函数参数 */
          arg: string;
          /** setter 函数体 */
          body: string;
        };
      };
    };
  };
}

export interface ProvideData {
  name: string;
  value: string;
  isOccupied: boolean;
  provide: ProvideData | Record<string, any>;
}

export interface IPropsContext {
  /**
   * props 接口名称
   */
  name: string;

  /**
   * 用于记录源码中对应 API 的 ts 类型
   *
   * 1.推导出的属性元数据，如 (defineProps(['foo', 'bar']))
   * 记录 key 和对应的类型（默认为 any/String 等）
   *
   * 2.显式定义的 TS 类型节点，如 (defineProps<{...}>)
   */

  propsTypes: t.TSType[];
  emitTypes: t.TSType[];
  slotTypes: t.TSType[];
}
