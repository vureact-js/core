import { TraverseOptions } from '@babel/traverse';
import * as t from '@babel/types';
import { compileContext } from '@src/shared/compile-context';
import { camelCase } from '@utils/camelCase';
import { capitalize } from '@utils/capitalize';
import { __scriptBlockIR } from '../..';
import { ReactCompProps } from '../../../const';
import { createPropsProcessor, PropDescribe } from '../../shared/processor-factory';

/**
 * 处理 Vue 组件的 props 和 emits 定义，将其转换为 React 组件的 Props 类型定义。
 * 支持 defineProps 和 defineEmits 的运行时声明及 TS 泛型声明。
 */
export function resolveProps(): TraverseOptions {
  return {
    CallExpression(path) {
      createPropsProcessor(path, {
        onProcessed(prop) {
          processPropType(prop);
          setPropTypes();
        },
      });
    },
  };
}

/**
 * 核心处理逻辑：根据 defineProps/defineEmits 的类型生成对应的 TS 类型节点
 */
function processPropType(prop: PropDescribe) {
  const { defineProps } = __scriptBlockIR;
  const { lang } = compileContext.context;

  const isTs = lang.script.startsWith('ts');
  // 提取泛型参数 (例如 defineProps<Props>())
  const tsGenericParam = prop.tsType?.params?.[0] as t.TSType | undefined;

  let newType: t.TSType | undefined;

  // 1. 处理 defineProps
  if (prop.type === 'defineProps') {
    // Case A: defineProps<Props>() - 直接使用泛型
    if (tsGenericParam) {
      newType = tsGenericParam;
    }
    // Case B: defineProps({ foo: String }) - 运行时对象转 TS 类型
    else if (isTs && (t.isObjectExpression(prop.arg?.[0]) || t.isArrayExpression(prop.arg?.[0]))) {
      newType = transformRuntimePropsToType(prop.arg[0]);
    }
  }
  // 2. 处理 defineEmits
  else if (prop.type === 'defineEmits') {
    if (tsGenericParam) {
      // Case C: defineEmits<(e: 'change') => void>() - TS 签名转 React 回调 props
      newType = transformTSEmitsToReactProps(tsGenericParam);
    } else if (isTs && t.isArrayExpression(prop.arg?.[0])) {
      // Case D: defineEmits(['change']) - 运行时数组转 TS 类型
      newType = transformRuntimeEmitsToType(prop.arg[0]);
    }
  }

  // 如果生成了新类型，将其合并到全局的 props 定义中
  if (newType) {
    defineProps.tsType = mergeTypeIntoAlias(newType, defineProps.tsType);
  }
}

// ===================================================================================
// Props 转换逻辑 (Runtime Object -> TS Type)
// ===================================================================================

/**
 * 将 Vue 运行时 props 对象转换为 TS 类型字面量
 * Example:
 *
 * ['foo', 'bar']
 * => { foo?: any; bar?: any; }
 *
 * { foo: String, bar: { type: Number, required: true } }
 * => { foo?: string; bar: number; }
 */
function transformRuntimePropsToType(obj: t.ObjectExpression | t.ArrayExpression): t.TSTypeLiteral {
  const properties: t.TSTypeElement[] = [];

  if (t.isObjectExpression(obj)) {
    for (const prop of obj.properties) {
      // 忽略展开运算符等非对象属性
      if (!t.isObjectProperty(prop)) continue;

      // 获取属性名
      const keyName = getKeyName(prop.key as t.Expression);
      if (!keyName) continue;

      // 解析值的类型和是否必填
      const { typeNode, required } = parsePropTypeAndRequired(prop.value);

      // 构建 TS 属性签名
      const propSignature = t.tsPropertySignature(
        t.identifier(keyName),
        t.tsTypeAnnotation(typeNode),
      );
      propSignature.optional = !required;

      properties.push(propSignature);
    }
  } else {
    for (const node of obj.elements) {
      if (!t.isStringLiteral(node)) continue;

      const propSignature = t.tsPropertySignature(
        t.identifier(node.value),
        t.tsTypeAnnotation(t.tsAnyKeyword()),
      );

      propSignature.optional = true;
      properties.push(propSignature);
    }
  }

  return t.tsTypeLiteral(properties);
}

/**
 * 解析单个 Prop 的值，返回对应的 TS 类型和 required 状态
 */
function parsePropTypeAndRequired(value: t.Node): { typeNode: t.TSType; required: boolean } {
  let required = false;
  let typeNodes: t.TSType[] = [];

  // 场景 1: 简写形式 foo: String
  if (t.isIdentifier(value)) {
    typeNodes.push(mapVueConstructorToTSType(value.name));
  }
  // 场景 2: 数组形式 foo: [String, Number]
  else if (t.isArrayExpression(value)) {
    typeNodes = extractTypesFromArray(value);
  }
  // 场景 3: 对象配置形式 foo: { type: String, required: true }
  else if (t.isObjectExpression(value)) {
    for (const p of value.properties) {
      if (!t.isObjectProperty(p) || !t.isIdentifier(p.key)) continue;

      // 处理 type 字段
      if (p.key.name === 'type') {
        if (t.isIdentifier(p.value)) {
          typeNodes.push(mapVueConstructorToTSType(p.value.name));
        } else if (t.isArrayExpression(p.value)) {
          typeNodes = extractTypesFromArray(p.value);
        }
      }

      // 处理 required 字段
      if (p.key.name === 'required' && t.isBooleanLiteral(p.value)) {
        required = p.value.value;
      }
    }
  }

  // 组合最终类型
  let finalType: t.TSType;
  if (typeNodes.length === 0) {
    finalType = t.tsAnyKeyword();
  } else if (typeNodes.length === 1) {
    finalType = typeNodes[0]!;
  } else {
    finalType = t.tsUnionType(typeNodes);
  }

  return { typeNode: finalType, required };
}

/**
 * 辅助函数：从数组表达式中提取类型
 */
function extractTypesFromArray(arr: t.ArrayExpression): t.TSType[] {
  return arr.elements
    .filter((e): e is t.Identifier => t.isIdentifier(e))
    .map((e) => mapVueConstructorToTSType(e.name));
}

/**
 * 映射 Vue 构造函数名为 TS 类型
 */
function mapVueConstructorToTSType(name: string): t.TSType {
  switch (name) {
    case 'String':
      return t.tsStringKeyword();
    case 'Number':
      return t.tsNumberKeyword();
    case 'Boolean':
      return t.tsBooleanKeyword();
    case 'Array':
      return t.tsArrayType(t.tsAnyKeyword());
    case 'Object':
      return t.tsTypeLiteral([]); // Record<string, any> 可能更准确，但保持空接口兼容性更好
    case 'Function':
      return t.tsFunctionType(null, [], t.tsTypeAnnotation(t.tsAnyKeyword()));
    case 'Date':
      return t.tsTypeReference(t.identifier('Date')); // 使用 Date 引用而非 Any
    case 'Symbol':
      return t.tsSymbolKeyword();
    default:
      return t.tsAnyKeyword();
  }
}

// ===================================================================================
// Emits 转换逻辑 (Emits -> React Handler Props)
// ===================================================================================

/**
 * 将运行时 Emits 数组转换为 TS 类型
 * Example: ['change']
 * => { onChange: (...args: any[]) => any }
 */
function transformRuntimeEmitsToType(arr: t.ArrayExpression): t.TSTypeLiteral {
  const members: t.TSTypeElement[] = [];

  for (const element of arr.elements) {
    if (t.isStringLiteral(element)) {
      const propName = convertEventNameToReactProp(element.value);
      const id = t.identifier('...args');

      id.typeAnnotation = t.tsTypeAnnotation(t.tsArrayType(t.tsAnyKeyword()));

      members.push(
        t.tsPropertySignature(
          t.identifier(propName),
          t.tsTypeAnnotation(t.tsFunctionType(null, [id], t.tsTypeAnnotation(t.tsAnyKeyword()))),
        ),
      );
    }
  }

  return t.tsTypeLiteral(members);
}

/**
 * 将 TS 定义的 Emits 转换为 React Handler Props
 * 处理两种 TS 定义风格：
 * 1. 对象字面量风格: { 'change': [id: number] }
 * 2. 调用签名风格: (e: 'change', id: number) => void
 */
function transformTSEmitsToReactProps(tsType: t.TSType): t.TSType {
  // 如果不是对象字面量类型（例如是 TypeReference），降级为通用 Handler
  if (!t.isTSTypeLiteral(tsType)) {
    return tsType;
  }

  const members: t.TSTypeElement[] = [];

  for (const member of tsType.members) {
    // 风格 1: TS Property Signature -> { change: [arg: string] }
    if (t.isTSPropertySignature(member)) {
      const eventName = getKeyName(member.key);
      if (!eventName) continue;

      const propName = convertEventNameToReactProp(eventName);
      let functionType: t.TSType = t.tsAnyKeyword();

      // 尝试解析 Tuple 类型作为参数列表
      if (t.isTSTypeAnnotation(member.typeAnnotation)) {
        const annotation = member.typeAnnotation.typeAnnotation;
        if (t.isTSTupleType(annotation)) {
          functionType = createFunctionTypeFromTuple(annotation);
        }
      }

      members.push(t.tsPropertySignature(t.identifier(propName), t.tsTypeAnnotation(functionType)));
    }
    // 风格 2: TS Call Signature -> (e: 'change', val: string) => void
    else if (t.isTSCallSignatureDeclaration(member)) {
      const params = member.parameters || [];
      if (params.length === 0) continue;

      // 第一个参数必须是事件名 (e: 'change' | 'input')
      const eventNameNode = params[0];
      const eventNames = extractEventNamesFromParam(eventNameNode as t.Identifier);

      if (eventNames.length === 0) continue;

      // 获取回调函数的返回值类型 (React handler 通常是 void，但这里保留原定义或 Any)
      const returnType = t.isTSTypeAnnotation(member.typeAnnotation)
        ? member.typeAnnotation.typeAnnotation
        : t.tsAnyKeyword();

      // 构建函数类型：移除第一个事件名参数，保留后续参数
      const payloadParams = params.slice(1);
      const handlerType = t.tsFunctionType(null, payloadParams, t.tsTypeAnnotation(returnType));

      // 为每个可能的事件名生成一个 React Prop
      eventNames.forEach((name) => {
        members.push(
          t.tsPropertySignature(
            t.identifier(convertEventNameToReactProp(name)),
            t.tsTypeAnnotation(handlerType),
          ),
        );
      });
    }
  }

  return t.tsTypeLiteral(members);
}

// ===================================================================================
// 工具函数 (Helpers)
// ===================================================================================

/**
 * 将新的 Props 类型合并到现有的 Props 别名中 (创建交叉类型)
 */
export function mergeTypeIntoAlias(
  newType: t.TSType,
  existing?: t.TSTypeAliasDeclaration,
): t.TSTypeAliasDeclaration {
  // 如果没有现有类型，创建一个新的类型别名 ReactCompProps = NewType
  if (!existing) {
    return t.tsTypeAliasDeclaration(t.identifier(ReactCompProps), null, newType);
  }

  // 如果已有类型，创建交叉类型 ReactCompProps = OldType & NewType
  const existingType = existing.typeAnnotation;
  const intersection = t.tsIntersectionType([existingType, newType]);
  return t.tsTypeAliasDeclaration(t.identifier(ReactCompProps), null, intersection);
}

/**
 * 将事件名转换为 React Prop 名 (e.g., 'update:modelValue' -> 'onUpdateModelValue')
 */
function convertEventNameToReactProp(key: string): string {
  // 标准化分隔符，确保 camelCase 能正确处理 'update:model-value' 等情况
  const normalized = key.replace(/[:.\-\s]+/g, '-');
  return 'on' + capitalize(camelCase(normalized));
}

/**
 * 安全获取 ObjectProperty 或 TSPropertySignature 的键名
 */
function getKeyName(key: t.Expression | t.LVal): string | undefined {
  if (t.isIdentifier(key)) return key.name;
  if (t.isStringLiteral(key)) return key.value;
  return undefined;
}

/**
 * 从函数参数中提取事件名字符串 (支持字面量和联合类型)
 */
function extractEventNamesFromParam(param: t.Identifier | t.Pattern | t.RestElement): string[] {
  if (!t.isIdentifier(param) || !t.isTSTypeAnnotation(param.typeAnnotation)) {
    return [];
  }

  const typeNode = param.typeAnnotation.typeAnnotation;

  // Case: (e: 'click')
  if (t.isTSLiteralType(typeNode) && t.isStringLiteral(typeNode.literal)) {
    return [typeNode.literal.value];
  }

  // Case: (e: 'click' | 'change')
  if (t.isTSUnionType(typeNode)) {
    return typeNode.types
      .filter(
        (ut): ut is t.TSLiteralType & { literal: t.StringLiteral } =>
          t.isTSLiteralType(ut) && t.isStringLiteral(ut.literal),
      )
      .map((ut) => ut.literal.value);
  }

  return [];
}

/**
 * 根据 Tuple 类型创建函数类型 (用于 defineEmits 对象语法)
 */
function createFunctionTypeFromTuple(tuple: t.TSTupleType): t.TSFunctionType {
  const params = tuple.elementTypes.map((et, i) => {
    let typeNode: t.TSType;
    let name = `arg${i}`;
    if (t.isTSNamedTupleMember(et)) {
      typeNode = et.elementType as t.TSType;
      if (t.isIdentifier(et.label)) name = et.label.name;
    } else {
      typeNode = et as t.TSType;
    }
    const id = t.identifier(name);
    id.typeAnnotation = t.tsTypeAnnotation(typeNode);
    return id;
  });
  return t.tsFunctionType(null, params, t.tsTypeAnnotation(t.tsAnyKeyword()));
}

function setPropTypes() {
  const { tsTypes, defineProps } = __scriptBlockIR;
  const propsType = defineProps.tsType;

  if (propsType) {
    const exists = tsTypes.some((ts) => {
      if (t.isTSTypeAliasDeclaration(ts) && ts.id.name === ReactCompProps) {
        ts.typeAnnotation = propsType.typeAnnotation;
        return true;
      }
    });

    if (!exists) {
      tsTypes.push(propsType);
    }

    defineProps.id.typeAnnotation = t.tsTypeAnnotation(t.tSTypeReference(propsType.id));
  }
}
