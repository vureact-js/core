import { NodePath, TraverseOptions } from '@babel/traverse';
import * as t from '@babel/types';
import { ICompilationContext } from '@compiler/context/types';
import { camelCase } from '@utils/camelCase';
import { capitalize } from '@utils/capitalize';
import { cloneCallableParams } from './shared';

/**
 * 解析顶层的 defineEmits 类型声明，并将 Vue 风格的
 * 调用签名转换为 React 风格的 onXxx 处理器。
 */
export function resolveEmitsTopLevelTypes(ctx: ICompilationContext): TraverseOptions {
  return {
    'TSInterfaceDeclaration|TSTypeAliasDeclaration'(path) {
      if (!t.isProgram(path.parent)) return;

      const { node } = path;

      // 转换顶层的 defineEmits 风格类型声明（接口/类型别名）。
      if (t.isTSInterfaceDeclaration(node)) {
        const typeLiteral = t.tsTypeLiteral(node.body.body);

        // 仅当接口包含 defineEmits 风格的调用签名时才进行转换。
        if (!hasEmitsSignatureInType(typeLiteral)) return;

        const resolved = resolveTopLevelEmitType(typeLiteral);

        if (resolved && t.isTSTypeLiteral(resolved)) {
          node.body.body = resolved.members;
        }

        return;
      }

      if (t.isTSTypeAliasDeclaration(node)) {
        // 仅当别名包含 defineEmits 风格的调用签名时才进行转换。
        if (!hasEmitsSignatureInType(node.typeAnnotation)) return;

        const resolved = resolveTopLevelEmitType(node.typeAnnotation);

        if (resolved) {
          node.typeAnnotation = resolved;
        }
      }
    },
  };
}

function resolveTopLevelEmitType(tsType: t.TSType): t.TSType | null {
  if (t.isTSParenthesizedType(tsType)) {
    return resolveTopLevelEmitType(tsType.typeAnnotation);
  }

  if (t.isTSTypeReference(tsType)) {
    if (!tsType.typeParameters || !tsType.typeParameters.params.length) {
      return tsType;
    }

    const params = tsType.typeParameters.params
      .map((param) => resolveTopLevelEmitType(param))
      .filter(Boolean) as t.TSType[];

    return t.tsTypeReference(
      tsType.typeName,
      t.tsTypeParameterInstantiation(params.length ? params : tsType.typeParameters.params),
    );
  }

  if (t.isTSIntersectionType(tsType)) {
    const types = tsType.types.map(resolveTopLevelEmitType).filter(Boolean) as t.TSType[];
    if (!types.length) return null;
    if (types.length === 1) return types[0]!;
    return t.tsIntersectionType(types);
  }

  if (t.isTSUnionType(tsType)) {
    const types = tsType.types.map(resolveTopLevelEmitType).filter(Boolean) as t.TSType[];
    if (!types.length) return null;
    if (types.length === 1) return types[0]!;
    return t.tsUnionType(types);
  }

  if (t.isTSTypeLiteral(tsType)) {
    const members: t.TSTypeElement[] = [];

    for (const member of tsType.members) {
      if (t.isTSCallSignatureDeclaration(member)) {
        members.push(...resolveEmitPropsFromCallSignature(member));
        continue;
      }

      // 保留非调用签名的成员不变，避免转换普通属性。
      members.push(member);
    }

    if (!members.length) return null;
    return t.tsTypeLiteral(members);
  }

  if (t.isTSFunctionType(tsType)) {
    const props = resolveEmitPropsFromCallable(tsType.parameters, tsType.typeAnnotation);
    if (!props.length) return null;
    return t.tsTypeLiteral(props);
  }

  return tsType;
}

/**
 * 解析 defineEmits 的 TS 类型注解。
 */
export function resolveDefineEmitsIface(
  path: NodePath<t.CallExpression>,
  ctx: ICompilationContext,
) {
  const { node } = path;
  const [runtimeArg] = node.arguments;
  const tsParams = node.typeParameters?.params;

  // 当提供了显式的 TS 类型参数时，优先使用它们。
  if (tsParams?.length) {
    processExplicitType(ctx, tsParams);
    return;
  }

  if (runtimeArg) {
    processInferredTypes(ctx, runtimeArg);
  }
}

// 处理 defineEmits 的运行时定义。
function processInferredTypes(
  ctx: ICompilationContext,
  runtimeArg: t.Expression | t.SpreadElement | t.ArgumentPlaceholder,
) {
  const {
    propsTSIface: { emitTypes },
  } = ctx.scriptData;

  const members: t.TSTypeElement[] = [];

  // 运行时数组语法：defineEmits(['change', 'update'])。
  if (t.isArrayExpression(runtimeArg)) {
    for (const element of runtimeArg.elements) {
      if (!element || !t.isStringLiteral(element)) continue;

      // 将事件名称规范化为 React 风格的处理器键名（onXxx）。
      const handlerName = resolveEmitHandlerName(element.value);
      const key = buildKey(handlerName);

      const fnType = t.tsFunctionType(
        null,
        [createRestAnyParam('args')],
        t.tsTypeAnnotation(t.tsAnyKeyword()),
      );

      const prop = t.tsPropertySignature(key, t.tsTypeAnnotation(fnType));
      prop.optional = true;
      members.push(prop);
    }

    if (members.length) {
      emitTypes.push(t.tsTypeLiteral(members));
    }

    return;
  }

  // 运行时对象语法：defineEmits({ update: [value: number] })。
  if (t.isObjectExpression(runtimeArg)) {
    for (const prop of runtimeArg.properties) {
      if (!t.isObjectProperty(prop)) continue;
      if (t.isSpreadElement(prop)) continue;

      const rawName = resolvePropName(prop.key);
      if (!rawName) continue;

      const handlerName = resolveEmitHandlerName(rawName);
      const key = buildKey(handlerName);

      // 元组语法是显式的；否则回退到宽松的剩余参数类型。
      const params = t.isArrayExpression(prop.value)
        ? resolveRuntimeTupleParams(prop.value)
        : [createRestAnyParam('args')];

      const fnType = t.tsFunctionType(null, params, t.tsTypeAnnotation(t.tsAnyKeyword()));
      const propSig = t.tsPropertySignature(key, t.tsTypeAnnotation(fnType));
      propSig.optional = true;
      members.push(propSig);
    }

    if (members.length) {
      emitTypes.push(t.tsTypeLiteral(members));
    }
  }
}

function processExplicitType(ctx: ICompilationContext, tsParams: t.TSType[]) {
  const {
    propsTSIface: { emitTypes },
  } = ctx.scriptData;

  for (const tsType of tsParams) {
    const resolved = resolveExplicitEmitType(tsType);

    if (resolved) {
      emitTypes.push(resolved);
    }
  }
}

// 将事件名称规范化为 React 处理器属性名。
function resolveEmitHandlerName(rawName: string): string {
  const parts = rawName.split(/[:\-]/).filter(Boolean);
  const name = parts.map((part) => camelCase(capitalize(part))).join('') || rawName;
  return `on${name}`;
}

function resolvePropName(key: t.Expression | t.PrivateName): string | null {
  if (t.isIdentifier(key)) return key.name;
  if (t.isStringLiteral(key)) return key.value;
  if (t.isNumericLiteral(key)) return String(key.value);
  return null;
}

function buildKey(name: string): t.Identifier | t.StringLiteral {
  return t.isValidIdentifier(name) ? t.identifier(name) : t.stringLiteral(name);
}

function createRestAnyParam(name: string): t.RestElement {
  const id = t.identifier(name);
  const rest = t.restElement(id);
  rest.typeAnnotation = t.tsTypeAnnotation(t.tsArrayType(t.tsAnyKeyword()));
  return rest;
}

function resolveRuntimeTupleParams(value: t.ArrayExpression): Array<t.Identifier | t.RestElement> {
  const params: Array<t.Identifier | t.RestElement> = [];

  value.elements.forEach((element, index) => {
    if (!element) return;

    // 运行时数组中的扩展运算符被视为剩余参数。
    if (t.isSpreadElement(element)) {
      params.push(createRestAnyParam(`args${index}`));
      return;
    }

    if (t.isIdentifier(element)) {
      const id = t.identifier(element.name);
      id.typeAnnotation = element.typeAnnotation || t.tsTypeAnnotation(t.tsAnyKeyword());
      params.push(id);
      return;
    }

    if (t.isTSAsExpression(element)) {
      const id = t.identifier(`arg${index}`);
      id.typeAnnotation = t.tsTypeAnnotation(element.typeAnnotation);
      params.push(id);
      return;
    }

    const fallback = t.identifier(`arg${index}`);
    fallback.typeAnnotation = t.tsTypeAnnotation(t.tsAnyKeyword());
    params.push(fallback);
  });

  return params;
}

function resolveExplicitEmitType(tsType: t.TSType): t.TSType | null {
  if (t.isTSParenthesizedType(tsType)) {
    return resolveExplicitEmitType(tsType.typeAnnotation);
  }

  if (t.isTSTypeReference(tsType)) {
    if (!tsType.typeParameters || !tsType.typeParameters.params.length) {
      return tsType;
    }

    // 保留包装类型（例如 Partial/Required），但转换其内部的 emit 签名。
    const params = tsType.typeParameters.params
      .map((param) => resolveExplicitEmitType(param))
      .filter(Boolean) as t.TSType[];

    return t.tsTypeReference(
      tsType.typeName,
      t.tsTypeParameterInstantiation(params.length ? params : tsType.typeParameters.params),
    );
  }

  if (t.isTSIntersectionType(tsType)) {
    const types = tsType.types.map(resolveExplicitEmitType).filter(Boolean) as t.TSType[];
    if (!types.length) return null;
    if (types.length === 1) return types[0]!;
    return t.tsIntersectionType(types);
  }

  if (t.isTSUnionType(tsType)) {
    const types = tsType.types.map(resolveExplicitEmitType).filter(Boolean) as t.TSType[];
    if (!types.length) return null;
    if (types.length === 1) return types[0]!;
    return t.tsUnionType(types);
  }

  if (t.isTSTypeLiteral(tsType)) {
    const members: t.TSTypeElement[] = [];

    for (const member of tsType.members) {
      if (t.isTSPropertySignature(member)) {
        const prop = resolveEmitPropFromPropertySignature(member);
        if (prop) members.push(prop);
        continue;
      }

      if (t.isTSCallSignatureDeclaration(member)) {
        members.push(...resolveEmitPropsFromCallSignature(member));
        continue;
      }
    }

    if (!members.length) return null;
    return t.tsTypeLiteral(members);
  }

  if (t.isTSFunctionType(tsType)) {
    const props = resolveEmitPropsFromCallable(tsType.parameters, tsType.typeAnnotation);
    if (!props.length) return null;
    return t.tsTypeLiteral(props);
  }

  return tsType;
}

function hasEmitsSignatureInType(tsType: t.TSType): boolean {
  if (t.isTSParenthesizedType(tsType)) {
    return hasEmitsSignatureInType(tsType.typeAnnotation);
  }

  if (t.isTSTypeReference(tsType)) {
    if (!tsType.typeParameters || !tsType.typeParameters.params.length) {
      return false;
    }
    return tsType.typeParameters.params.some(hasEmitsSignatureInType);
  }

  if (t.isTSIntersectionType(tsType) || t.isTSUnionType(tsType)) {
    return tsType.types.some(hasEmitsSignatureInType);
  }

  if (t.isTSTypeLiteral(tsType)) {
    return tsType.members.some(hasEmitsSignatureInMember);
  }

  if (t.isTSFunctionType(tsType)) {
    return isEmitsCallable(tsType.parameters);
  }

  return false;
}

function hasEmitsSignatureInMember(member: t.TSTypeElement): boolean {
  if (t.isTSCallSignatureDeclaration(member)) {
    return isEmitsCallable(member.parameters);
  }

  return false;
}

function isEmitsCallable(parameters: Array<t.Identifier | t.RestElement | t.PatternLike>): boolean {
  const [eventParam] = parameters;

  if (!eventParam || !t.isIdentifier(eventParam) || !eventParam.typeAnnotation) {
    return false;
  }

  const { typeAnnotation } = eventParam;

  if (t.isNoop(typeAnnotation)) return false;

  return resolveEventNames(typeAnnotation.typeAnnotation as t.TSType).length > 0;
}

function resolveEmitPropFromPropertySignature(
  member: t.TSPropertySignature,
): t.TSPropertySignature | null {
  const rawName = resolvePropName(member.key as t.Expression);
  if (!rawName) return null;

  const handlerName = resolveEmitHandlerName(rawName);
  const key = buildKey(handlerName);

  const typeAnnotation = member.typeAnnotation?.typeAnnotation;
  let params: Array<t.Identifier | t.RestElement> = [];
  let returnType: t.TSType = t.tsAnyKeyword();

  if (typeAnnotation && t.isTSFunctionType(typeAnnotation)) {
    params = cloneCallableParams(typeAnnotation.parameters);
    returnType = typeAnnotation.typeAnnotation?.typeAnnotation ?? returnType;
  } else if (typeAnnotation && t.isTSTupleType(typeAnnotation)) {
    // 元组类型直接映射到函数参数。
    params = resolveTupleTypeParams(typeAnnotation);
  } else if (typeAnnotation) {
    const id = t.identifier('value');
    id.typeAnnotation = t.tsTypeAnnotation(typeAnnotation);
    params = [id];
  }

  const fnType = t.tsFunctionType(null, params, t.tsTypeAnnotation(returnType));
  const prop = t.tsPropertySignature(key, t.tsTypeAnnotation(fnType));
  // 保留源属性签名中的可选标记。
  prop.optional = !!member.optional;
  return prop;
}

function resolveEmitPropsFromCallSignature(
  member: t.TSCallSignatureDeclaration,
): t.TSPropertySignature[] {
  return resolveEmitPropsFromCallable(member.parameters, member.typeAnnotation);
}

function resolveEmitPropsFromCallable(
  parameters: Array<t.Identifier | t.RestElement | t.PatternLike>,
  typeAnnotation?: t.TSTypeAnnotation | null,
): t.TSPropertySignature[] {
  const [eventParam, ...restParams] = parameters;

  if (!eventParam || !t.isIdentifier(eventParam) || !eventParam.typeAnnotation) {
    return [];
  }

  const { typeAnnotation: paramTypeAnnotation } = eventParam;

  if (t.isNoop(paramTypeAnnotation)) return [];

  // 第一个参数是事件名称；它可能是一个字面量或字面量的联合类型。
  const eventNames = resolveEventNames(paramTypeAnnotation.typeAnnotation as t.TSType);

  if (!eventNames.length) return [];

  const returnType = typeAnnotation?.typeAnnotation ?? t.tsAnyKeyword();

  return eventNames.map((eventName) => {
    const handlerName = resolveEmitHandlerName(eventName);
    const key = buildKey(handlerName);
    const params = cloneCallableParams(restParams);

    const fnType = t.tsFunctionType(null, params, t.tsTypeAnnotation(returnType));
    const prop = t.tsPropertySignature(key, t.tsTypeAnnotation(fnType));
    prop.optional = true;
    return prop;
  });
}

function resolveEventNames(type: t.TSType): string[] {
  if (t.isTSLiteralType(type) && t.isStringLiteral(type.literal)) {
    return [type.literal.value];
  }

  if (t.isTSUnionType(type)) {
    return type.types.flatMap(resolveEventNames);
  }

  if (t.isTSParenthesizedType(type)) {
    return resolveEventNames(type.typeAnnotation);
  }

  return [];
}

function resolveTupleTypeParams(tuple: t.TSTupleType): Array<t.Identifier | t.RestElement> {
  const params: Array<t.Identifier | t.RestElement> = [];

  tuple.elementTypes.forEach((element, index) => {
    params.push(resolveTupleElementParam(element, index));
  });

  return params;
}

function resolveTupleElementParam(
  element: t.TSNamedTupleMember | t.TSType,
  index: number,
): t.Identifier | t.RestElement {
  const isNamedTuple =
    typeof (t as any).isTSNamedTupleMember === 'function' &&
    (t as any).isTSNamedTupleMember(element);

  if (isNamedTuple) {
    const tupleMember = element as t.TSNamedTupleMember;
    const name = tupleMember.label?.name || `arg${index}`;
    let innerType = tupleMember.elementType;
    let optional = tupleMember.optional;

    if (t.isTSOptionalType(innerType)) {
      optional = true;
      innerType = innerType.typeAnnotation;
    }

    if (t.isTSRestType(innerType)) {
      const rest = t.restElement(t.identifier(name));
      rest.typeAnnotation = t.tsTypeAnnotation(innerType.typeAnnotation);
      return rest;
    }

    const id = t.identifier(name);
    id.optional = optional;
    id.typeAnnotation = t.tsTypeAnnotation(innerType);
    return id;
  }

  if (t.isTSRestType(element)) {
    const rest = t.restElement(t.identifier(`args${index}`));
    rest.typeAnnotation = t.tsTypeAnnotation(element.typeAnnotation);
    return rest;
  }

  if (t.isTSOptionalType(element)) {
    const id = t.identifier(`arg${index}`);
    id.optional = true;
    id.typeAnnotation = t.tsTypeAnnotation(element.typeAnnotation);
    return id;
  }

  const id = t.identifier(`arg${index}`);
  id.typeAnnotation = t.tsTypeAnnotation(element as t.TSType);

  return id;
}
