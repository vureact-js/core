import { NodePath, TraverseOptions } from '@babel/traverse';
import * as t from '@babel/types';
import { ICompilationContext, SlotNodesContext } from '@compiler/context/types';
import { PACKAGE_NAME } from '@consts/other';
import { REACT_API_MAP } from '@consts/react-api-map';
import { recordImport } from '@transform/shared';
import { expressionToTSType } from '../../../shared/babel-utils';
import { cloneCallableParams } from './shared';

const SLOT_DEFAULT_NAME = 'default';
const SLOT_CHILDREN_NAME = 'children';
const SLOT_FN_PARAM_NAME = 'props';

/**
 * 解析顶层的 `defineSlots` 类型声明：
 * 将 Vue 模板中描述的 slot 调用签名，转换为 React 组件使用的 props 类型。
 */
export function resolveSlotsTopLevelTypes(ctx: ICompilationContext): TraverseOptions {
  return {
    'TSInterfaceDeclaration|TSTypeAliasDeclaration'(path) {
      if (!t.isProgram(path.parent)) return;

      const { node } = path;

      // 将顶层的 `defineSlots` 插槽类型声明转换成 React 可识别的 props 签名
      if (t.isTSInterfaceDeclaration(node)) {
        const typeLiteral = t.tsTypeLiteral(node.body.body);

        if (!hasSlotsSignatureInType(typeLiteral)) return;

        const resolved = resolveSlotType(typeLiteral);

        if (resolved && t.isTSTypeLiteral(resolved)) {
          node.body.body = resolved.members;
          recordReactNode(ctx);
        }

        return;
      }

      if (t.isTSTypeAliasDeclaration(node)) {
        if (!hasSlotsSignatureInType(node.typeAnnotation)) return;

        const resolved = resolveSlotType(node.typeAnnotation);

        if (resolved) {
          node.typeAnnotation = resolved;
          recordReactNode(ctx);
        }
      }
    },
  };
}

/**
 * 解析 `defineSlots` 的 TypeScript 类型参数并把解析结果记录到编译上下文。
 */
export function resolveDefineSlotsIface(
  path: NodePath<t.CallExpression>,
  ctx: ICompilationContext,
) {
  const { node } = path;
  const tsParams = node.typeParameters?.params;

  if (!tsParams?.length) return;

  const {
    propsTSIface: { slotTypes },
  } = ctx.scriptData;

  for (const tsType of tsParams) {
    const resolved = resolveSlotType(tsType);

    if (resolved) {
      slotTypes.push(resolved);
    }
  }

  if (slotTypes.length) {
    recordReactNode(ctx);
  }
}

/**
 * 解析模板中声明的插槽（匿名或具名）的 TypeScript 类型信息。
 * 如果已经通过 `defineSlots` 指定了类型则跳过。
 * 否则根据模板 `slots` 信息构建对应的 TS 类型并记录到上下文。
 */
export function resolveTemplateSlotIface(ctx: ICompilationContext) {
  if (ctx.inputType !== 'sfc') return;

  const {
    propsTSIface: { slotTypes },
  } = ctx.scriptData;

  // 如果已使用 defineSlots，则无需再推导 ts 类型
  if (slotTypes.length) return;

  const { slots } = ctx.templateData;
  const tsMembers: t.TSPropertySignature[] = [];

  for (const name in slots) {
    const slotObj = slots[name];

    if (!slotObj) continue;

    const params = slotObj.isScope ? [createSlotScopeParam(slotObj.props, ctx)] : [];
    const tsNode = buildSlotPropSignature(slotObj.name, params, true);
    tsMembers.push(tsNode);
  }

  if (tsMembers.length) {
    recordReactNode(ctx);
    slotTypes.push(t.tsTypeLiteral(tsMembers));
  }
}

// 记录需要导入 React.ReactNode
function recordReactNode(ctx: ICompilationContext) {
  // 非 ts 环境不导入
  if (!ctx.scriptData.lang.startsWith('ts')) {
    return;
  }
  recordImport(ctx, PACKAGE_NAME.react, REACT_API_MAP.ReactNode);
}

// 将各种可能的 TS 类型节点转换为表示 slots 调用签名的类型
function resolveSlotType(tsType: t.TSType): t.TSType | null {
  if (t.isTSParenthesizedType(tsType)) {
    return resolveSlotType(tsType.typeAnnotation);
  }

  if (t.isTSTypeReference(tsType)) {
    if (!tsType.typeParameters || !tsType.typeParameters.params.length) {
      return tsType;
    }

    const params = tsType.typeParameters.params
      .map((param) => resolveSlotType(param))
      .filter(Boolean) as t.TSType[];

    return t.tsTypeReference(
      tsType.typeName,
      t.tsTypeParameterInstantiation(params.length ? params : tsType.typeParameters.params),
    );
  }

  if (t.isTSIntersectionType(tsType)) {
    const types = tsType.types.map(resolveSlotType).filter(Boolean) as t.TSType[];
    if (!types.length) return null;
    if (types.length === 1) return types[0]!;
    return t.tsIntersectionType(types);
  }

  if (t.isTSUnionType(tsType)) {
    const types = tsType.types.map(resolveSlotType).filter(Boolean) as t.TSType[];
    if (!types.length) return null;
    if (types.length === 1) return types[0]!;
    return t.tsUnionType(types);
  }

  if (t.isTSTypeLiteral(tsType)) {
    const members: t.TSTypeElement[] = [];

    for (const member of tsType.members) {
      const resolved = resolveSlotPropFromMember(member);
      if (resolved) {
        members.push(resolved);
        continue;
      }

      members.push(member);
    }

    if (!members.length) return null;
    return t.tsTypeLiteral(members);
  }

  if (t.isTSFunctionType(tsType)) {
    const props = buildSlotPropSignature(
      SLOT_DEFAULT_NAME,
      cloneCallableParams(tsType.parameters),
      false,
    );
    return t.tsTypeLiteral([props]);
  }

  return tsType;
}

// 判断类型中是否包含 slot/可调用签名
function hasSlotsSignatureInType(tsType: t.TSType): boolean {
  if (t.isTSParenthesizedType(tsType)) {
    return hasSlotsSignatureInType(tsType.typeAnnotation);
  }

  if (t.isTSTypeReference(tsType)) {
    if (!tsType.typeParameters || !tsType.typeParameters.params.length) {
      return false;
    }
    return tsType.typeParameters.params.some(hasSlotsSignatureInType);
  }

  if (t.isTSIntersectionType(tsType) || t.isTSUnionType(tsType)) {
    return tsType.types.some(hasSlotsSignatureInType);
  }

  if (t.isTSTypeLiteral(tsType)) {
    return tsType.members.some(hasSlotsSignatureInMember);
  }

  if (t.isTSFunctionType(tsType)) {
    return true;
  }

  return false;
}

function hasSlotsSignatureInMember(member: t.TSTypeElement): boolean {
  if (t.isTSMethodSignature(member)) return true;
  if (t.isTSCallSignatureDeclaration(member)) return true;

  if (t.isTSPropertySignature(member)) {
    const typeAnnotation = member.typeAnnotation?.typeAnnotation;
    return !!(typeAnnotation && resolveCallableType(typeAnnotation));
  }

  return false;
}

// 从类型成员（方法/属性/调用签名）解析为 slot 的属性签名
function resolveSlotPropFromMember(member: t.TSTypeElement): t.TSPropertySignature | null {
  if (t.isTSMethodSignature(member)) {
    const rawName = resolvePropName(member.key);
    if (!rawName) return null;
    const params = cloneCallableParams(member.parameters);
    return buildSlotPropSignature(rawName, params, !!member.optional);
  }

  if (t.isTSPropertySignature(member)) {
    const rawName = resolvePropName(member.key as t.Expression);
    if (!rawName) return null;

    const typeAnnotation = member.typeAnnotation?.typeAnnotation;
    const callable = typeAnnotation ? resolveCallableType(typeAnnotation) : null;

    if (!callable) return null;

    const params = cloneCallableParams(callable.parameters);
    return buildSlotPropSignature(rawName, params, !!member.optional);
  }

  if (t.isTSCallSignatureDeclaration(member)) {
    const params = cloneCallableParams(member.parameters);
    return buildSlotPropSignature(SLOT_DEFAULT_NAME, params, true);
  }

  return null;
}

function resolveCallableType(tsType: t.TSType): t.TSFunctionType | null {
  if (t.isTSFunctionType(tsType)) return tsType;
  if (t.isTSParenthesizedType(tsType)) return resolveCallableType(tsType.typeAnnotation);
  return null;
}

// 构建最终的 `TSPropertySignature`，用于表示 React props（children 或函数）
function buildSlotPropSignature(
  rawName: string,
  params: Array<t.Identifier | t.RestElement>,
  optional: boolean,
): t.TSPropertySignature {
  const propName = rawName === SLOT_DEFAULT_NAME ? SLOT_CHILDREN_NAME : rawName;
  const key = t.isValidIdentifier(propName) ? t.identifier(propName) : t.stringLiteral(propName);
  const reactNodeType = t.tsTypeAnnotation(
    t.tsTypeReference(t.identifier(REACT_API_MAP.ReactNode)),
  );

  let typeAnnotation: t.TSTypeAnnotation;

  if (rawName === SLOT_DEFAULT_NAME && params.length === 0) {
    typeAnnotation = reactNodeType;
  } else {
    const fnType = t.tsFunctionType(null, params, reactNodeType);
    typeAnnotation = t.tsTypeAnnotation(fnType);
  }

  const prop = t.tsPropertySignature(key, typeAnnotation);
  prop.optional = optional;
  return prop;
}

function createSlotScopeParam(
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
    const propSign = t.tsPropertySignature(t.identifier(prop), typeAnnotation);

    propsSigns.push(propSign);
  });

  paramId.typeAnnotation = t.tsTypeAnnotation(t.tsTypeLiteral(propsSigns));
  return paramId;
}

function resolvePropName(key: t.Expression | t.PrivateName): string | null {
  if (t.isIdentifier(key)) return key.name;
  if (t.isStringLiteral(key)) return key.value;
  if (t.isNumericLiteral(key)) return String(key.value);
  return null;
}
