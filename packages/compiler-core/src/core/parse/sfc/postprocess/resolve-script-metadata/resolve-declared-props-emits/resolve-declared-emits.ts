import { NodePath } from '@babel/core';
import * as t from '@babel/types';
import { ICompilationContext } from '@compiler/context/types';
import { MACRO_API_NAMES } from '@consts/other';
import { isCalleeNamed } from '@transform/sfc/script/shared/babel-utils';
import {
  isJsLikeLang,
  mergeNames,
  resolveLocalTypeFromReference,
  resolveObjectOrArrayLiteralNames,
  resolveStaticName,
  resolveTsTypes,
} from './shared';

/**
 * 收集 defineEmits 中声明的 emits 名
 */
export function resolveDeclaredEmits(path: NodePath<t.CallExpression>, ctx: ICompilationContext) {
  const { node } = path;
  const { templateData, scriptData } = ctx;

  if (!isCalleeNamed(node, MACRO_API_NAMES.emits)) {
    return;
  }

  const [initValue] = node.arguments;
  const tsTypeDef = node.typeParameters;

  if (isJsLikeLang(scriptData.lang)) {
    mergeNames(templateData.declaredEmits, resolveObjectOrArrayLiteralNames(initValue));
    return;
  }

  // TS 环境优先从类型声明提取，提取不到再回退运行时参数。
  const namesFromType = resolveDeclaredEmitsFromTypeParams(tsTypeDef, path, ctx);

  if (namesFromType.size) {
    mergeNames(templateData.declaredEmits, namesFromType);
    return;
  }

  mergeNames(templateData.declaredEmits, resolveObjectOrArrayLiteralNames(initValue));
}

/**
 * 从 defineEmits 的 TypeScript 泛型参数中提取 emits 事件名称
 *
 * 该函数处理 defineEmits 的类型参数（如 defineEmits<{ (e: 'change'): void }>()），
 * 遍历所有类型参数，收集其中声明的事件名。
 */
function resolveDeclaredEmitsFromTypeParams(
  typeParams: t.CallExpression['typeParameters'],
  path: NodePath<t.CallExpression>,
  ctx: ICompilationContext,
): Set<string> {
  const names = new Set<string>();
  const visitedTypeRefs = new Set<string>();
  const warnedImportedTypeRefs = new Set<string>();

  // 解析出所有类型参数，然后逐个处理
  for (const tsType of resolveTsTypes(typeParams)) {
    collectEmitsFromTsType(tsType, names, path, ctx, visitedTypeRefs, warnedImportedTypeRefs);
  }

  return names;
}

/**
 * 从单个 TypeScript 类型节点中收集 emits 事件名称
 *
 * 递归处理各种类型结构，包括：
 * - 括号类型 (TSParenthesizedType)
 * - 交叉类型和联合类型 (TSIntersectionType, TSUnionType)
 * - 类型引用 (TSTypeReference)
 * - 函数类型 (TSFunctionType)
 * - 类型字面量 (TSTypeLiteral)
 *
 * 对于函数类型和类型字面量中的调用签名，会进一步解析其参数以提取事件名。
 */
function collectEmitsFromTsType(
  tsType: t.TSType,
  names: Set<string>,
  path: NodePath<t.CallExpression>,
  ctx: ICompilationContext,
  visitedTypeRefs: Set<string>,
  warnedImportedTypeRefs: Set<string>,
) {
  // 处理括号类型：递归处理内部的类型注解
  if (t.isTSParenthesizedType(tsType)) {
    collectEmitsFromTsType(
      tsType.typeAnnotation,
      names,
      path,
      ctx,
      visitedTypeRefs,
      warnedImportedTypeRefs,
    );
    return;
  }

  // 处理交叉类型和联合类型：递归处理每个子类型
  if (t.isTSIntersectionType(tsType) || t.isTSUnionType(tsType)) {
    for (const type of tsType.types) {
      collectEmitsFromTsType(type, names, path, ctx, visitedTypeRefs, warnedImportedTypeRefs);
    }
    return;
  }

  // 处理类型引用：递归处理泛型参数中的类型
  if (t.isTSTypeReference(tsType)) {
    const innerTypes = tsType.typeParameters?.params || [];

    for (const type of innerTypes) {
      collectEmitsFromTsType(type, names, path, ctx, visitedTypeRefs, warnedImportedTypeRefs);
    }

    const localType = resolveLocalTypeFromReference(
      path,
      tsType,
      ctx,
      MACRO_API_NAMES.emits,
      visitedTypeRefs,
      warnedImportedTypeRefs,
    );

    if (localType) {
      collectEmitsFromTsType(localType, names, path, ctx, visitedTypeRefs, warnedImportedTypeRefs);
    }

    return;
  }

  // 处理函数类型：解析其参数以提取事件名
  if (t.isTSFunctionType(tsType)) {
    collectEmitNamesFromCallable(tsType.parameters, names);
    return;
  }

  // 只有类型字面量包含我们需要的成员
  if (!t.isTSTypeLiteral(tsType)) {
    return;
  }

  // 遍历类型字面量的所有成员，提取事件名
  for (const member of tsType.members) {
    // 处理属性签名和方法签名：直接提取键名作为事件名
    if (t.isTSPropertySignature(member) || t.isTSMethodSignature(member)) {
      const eventName = resolveStaticName(member.key as t.Expression | t.PrivateName);

      if (eventName) {
        names.add(eventName);
      }
      continue;
    }

    // 处理调用签名：解析其参数以提取事件名
    if (t.isTSCallSignatureDeclaration(member)) {
      collectEmitNamesFromCallable(member.parameters, names);
    }
  }
}

/**
 * 从可调用类型（函数类型或调用签名）的第一个参数中收集事件名称
 *
 * 该函数用于处理 defineEmits 类型声明中的函数类型或调用签名。
 * 例如：`(e: 'change') => void` 或 `{ (e: 'change'): void }`。
 * 它会提取第一个参数的类型注解，并从中解析出字符串字面量类型作为事件名。
 */
function collectEmitNamesFromCallable(
  parameters: Array<t.Identifier | t.RestElement | t.PatternLike>,
  names: Set<string>,
) {
  // 获取第一个参数的类型注解
  const firstParamType = resolveFirstParamType(parameters[0]);
  if (!firstParamType) {
    return;
  }

  // 从类型注解中解析出所有字符串字面量类型作为事件名
  for (const eventName of resolveStringLiteralTypeNames(firstParamType)) {
    names.add(eventName);
  }
}

/**
 * 解析函数或调用签名的第一个参数的类型注解
 *
 * 该函数支持多种参数形式：
 * - 标识符参数（如 `e: 'change'`）
 * - 带默认值的参数（如 `e: 'change' = 'change'`）
 * - 剩余参数（如 `...args: string[]`）
 *
 * 它会提取参数的类型注解节点，如果参数没有类型注解或类型注解为空操作（Noop），则返回 null。
 */
function resolveFirstParamType(
  param: t.Identifier | t.RestElement | t.PatternLike | undefined,
): t.TSType | null {
  // 如果参数不存在，直接返回 null
  if (!param) {
    return null;
  }

  // 处理标识符参数：检查是否有类型注解
  if (t.isIdentifier(param) && param.typeAnnotation && !t.isNoop(param.typeAnnotation)) {
    return param.typeAnnotation.typeAnnotation as t.TSType;
  }

  // 处理带默认值的参数：检查左侧标识符是否有类型注解
  if (t.isAssignmentPattern(param)) {
    const left = param.left;

    if (t.isIdentifier(left) && left.typeAnnotation && !t.isNoop(left.typeAnnotation)) {
      return left.typeAnnotation.typeAnnotation as t.TSType;
    }
  }

  // 处理剩余参数：检查参数标识符是否有类型注解
  if (t.isRestElement(param) && t.isIdentifier(param.argument)) {
    const { typeAnnotation } = param.argument;

    if (typeAnnotation && !t.isNoop(typeAnnotation)) {
      return typeAnnotation.typeAnnotation as t.TSType;
    }
  }

  return null;
}

/**
 * 解析 TypeScript 字符串字面量类型节点，提取所有可能的字符串值
 *
 * 该函数递归处理以下类型结构：
 * - 括号类型 (TSParenthesizedType)：提取内部类型注解
 * - 联合类型 (TSUnionType)：展平所有子类型的结果
 * - 字面量类型 (TSLiteralType)：提取字符串字面量或模板字面量的值
 *
 * 主要用于从 defineEmits 的类型参数中提取事件名称。
 * 例如：`'change' | 'update'` 会返回 `['change', 'update']`。
 */
function resolveStringLiteralTypeNames(type: t.TSType): string[] {
  // 处理括号类型：递归处理内部的类型注解
  if (t.isTSParenthesizedType(type)) {
    return resolveStringLiteralTypeNames(type.typeAnnotation);
  }

  // 处理联合类型：递归处理每个子类型并展平结果
  if (t.isTSUnionType(type)) {
    return type.types.flatMap(resolveStringLiteralTypeNames);
  }

  // 只有字面量类型才包含我们需要的字符串值
  if (!t.isTSLiteralType(type)) {
    return [];
  }

  // 处理字符串字面量：直接返回其值
  if (t.isStringLiteral(type.literal)) {
    return [type.literal.value];
  }

  // 处理无插值的模板字面量：拼接所有模板元素作为字符串值
  if (t.isTemplateLiteral(type.literal) && !type.literal.expressions.length) {
    const cooked = type.literal.quasis.map((q) => q.value.cooked || '').join('');
    return cooked ? [cooked] : [];
  }

  return [];
}
