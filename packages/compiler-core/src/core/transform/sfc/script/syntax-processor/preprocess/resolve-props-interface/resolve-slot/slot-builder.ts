import * as t from '@babel/types';
import { ICompilationContext, SlotNodesContext } from '@compiler/context/types';
import { REACT_API_MAP } from '@consts/react-api-map';
import { expressionToTSType } from '@transform/sfc/script/shared/babel-utils';

const SLOT_DEFAULT_NAME = 'default';
const SLOT_CHILDREN_NAME = 'children';
const SLOT_FN_PARAM_NAME = 'props';

// 构建最终的 `TSPropertySignature`，用于表示 React props（children 或函数）
export function buildSlotPropSignature(
  rawName: string,
  params: Array<t.Identifier | t.RestElement>,
  optional: boolean,
): t.TSPropertySignature {
  const propName = rawName === SLOT_DEFAULT_NAME ? SLOT_CHILDREN_NAME : rawName;

  // 根据属性名是否为有效标识符，决定使用标识符还是字符串字面量作为 key
  const key = t.isValidIdentifier(propName) ? t.identifier(propName) : t.stringLiteral(propName);

  // 创建 ReactNode 类型引用，作为函数返回值或直接类型
  const reactNodeType = t.tsTypeAnnotation(
    t.tsTypeReference(t.identifier(REACT_API_MAP.ReactNode)),
  );

  let typeAnnotation: t.TSTypeAnnotation;

  // 判断插槽类型以确定类型注解：
  // 1. 默认插槽且无参数 -> 视为 children，使用 ReactNode 类型
  // 2. 非作用域插槽（无参数）-> 使用 ReactNode 类型
  // 3. 作用域插槽（有参数）-> 使用函数类型，参数为传入的 params，返回值为 ReactNode
  if ((rawName === SLOT_DEFAULT_NAME && params.length === 0) || params.length === 0) {
    typeAnnotation = reactNodeType;
  } else {
    const fnType = t.tsFunctionType(null, params, reactNodeType);
    typeAnnotation = t.tsTypeAnnotation(fnType);
  }

  const prop = t.tsPropertySignature(key, typeAnnotation);
  prop.optional = optional;
  
  return prop;
}

export function createSlotScopeParam(
  props: SlotNodesContext['props'],
  ctx: ICompilationContext,
): t.Identifier {
  const paramId = t.identifier(SLOT_FN_PARAM_NAME);
  const propsSigns: t.TSPropertySignature[] = [];
  const { reactiveBindings } = ctx.templateData;

  props.forEach(({ prop, tsType }) => {
    // 尝试从响应式绑定源中寻找对应 ts 类型
    const foundBindingValue = reactiveBindings[prop]?.value;
    const foundBindingTypes: t.TSType | null = foundBindingValue
      ? expressionToTSType(foundBindingValue)
      : null;

    const typeAnnotation = foundBindingTypes ? t.tsTypeAnnotation(foundBindingTypes) : tsType;

    // 对包含连字符等非法标识符的字段使用字符串字面量，避免 TS 语法错误
    const key = t.isValidIdentifier(prop) ? t.identifier(prop) : t.stringLiteral(prop);
    const propSign = t.tsPropertySignature(key, typeAnnotation);

    propsSigns.push(propSign);
  });

  paramId.typeAnnotation = t.tsTypeAnnotation(t.tsTypeLiteral(propsSigns));
  return paramId;
}
