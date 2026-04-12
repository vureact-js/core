import * as t from '@babel/types';

export interface ILocalTypeDeclaration {
  /** 类型节点 */
  type: t.TSType;

  /** 是否包含类型参数 */
  hasTypeParameters: boolean;
}

export interface ISlotTypeResolveOptions {
  /** 本地类型声明映射表 */
  localTypeDeclarations: Map<string, ILocalTypeDeclaration>;

  /** 已访问的类型名称集合，用于防止循环引用 */
  visitedTypeNames: Set<string>;
}

export interface ISlotTypeResolveResult {
  /** 解析得到的类型，若解析失败则为 null */
  type: t.TSType | null;

  /** 是否需要记录 ReactNode 类型 */
  shouldRecordReactNode: boolean;
}

export interface ISlotMemberResolveResult {
  /** 解析得到的属性签名成员，若解析失败则为 null */
  member: t.TSPropertySignature | null;

  /** 是否需要记录 ReactNode 类型 */
  shouldRecordReactNode: boolean;
}
