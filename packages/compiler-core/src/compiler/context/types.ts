import * as t from '@babel/types';
import { LangType } from '@shared/babel-utils';
import { ReactiveTypes } from '@shared/reactive-utils';

export interface ICompilationContext {
  fileId: string;
  source: string;
  compName: string;
  filename: string;
  imports: Map<string, ImportItem[]>;
  cssVars: string[];
  inputType: FileInputType;
  /** 函数组件的 prop 参数名 */
  propField: string;
  /** 是否使用了路由 */
  route?: boolean;
  /** 是否将 Less / Sass 样式语言处理为 CSS */
  preprocessStyles?: boolean;

  templateData: {
    lang?: string;
    /** 用于描述 `<slot>` / `<slot name="" ...props>` */
    slots: Record<string, SlotNodesContext>;
    /** 收集模板 ref 对应的 script 绑定元数据 */
    refBindings: RefBindings;
    /** 收集所有模板中的响应式变量，其来自 script 的绑定元数据 */
    reactiveBindings: ReactiveBindinds;
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

export type FileInputType = 'sfc' | 'script-js' | 'script-ts';

export interface SlotNodesContext {
  name: string;
  isScope: boolean;
  props: { prop: string; value: string; tsType: t.TSTypeAnnotation }[];
}

export interface ReactiveBindinds {
  [name: string]: {
    name: string;
    value: t.Expression;
    source: string;
    reactiveType: ReactiveTypes;
  };
}

export interface RefBindings {
  [name: string]: { tag: string; name: string; htmlType: string };
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
