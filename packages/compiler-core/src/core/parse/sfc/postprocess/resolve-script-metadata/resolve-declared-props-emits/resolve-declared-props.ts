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
 * 收集 defineProps 中声明的 props 名
 */
export function resolveDeclaredProps(path: NodePath<t.CallExpression>, ctx: ICompilationContext) {
  const { node } = path;
  const { templateData, scriptData } = ctx;

  if (!isCalleeNamed(node, MACRO_API_NAMES.props)) {
    return;
  }

  const [initValue] = node.arguments;
  const tsTypeDef = node.typeParameters;

  if (isJsLikeLang(scriptData.lang)) {
    mergeNames(templateData.declaredProps, resolveObjectOrArrayLiteralNames(initValue));
    return;
  }

  // TS 环境优先从类型声明提取，提取不到再回退运行时参数。
  const namesFromType = resolveDeclaredPropsFromTypeParams(tsTypeDef, path, ctx);

  if (namesFromType.size) {
    mergeNames(templateData.declaredProps, namesFromType);
    return;
  }

  mergeNames(templateData.declaredProps, resolveObjectOrArrayLiteralNames(initValue));
}

/**
 * 从 defineProps 的 TypeScript 泛型参数中提取 props 名称
 *
 * 该函数处理 defineProps 的类型参数（如 defineProps<{ prop1: string }>()），
 * 遍历所有类型参数，收集其中声明的属性名。
 */
function resolveDeclaredPropsFromTypeParams(
  typeParams: t.CallExpression['typeParameters'],
  path: NodePath<t.CallExpression>,
  ctx: ICompilationContext,
): Set<string> {
  const names = new Set<string>();
  const visitedTypeRefs = new Set<string>();
  const warnedImportedTypeRefs = new Set<string>();

  // 解析出所有类型参数，然后逐个处理
  for (const tsType of resolveTsTypes(typeParams)) {
    collectPropsFromTsType(tsType, names, path, ctx, visitedTypeRefs, warnedImportedTypeRefs);
  }

  return names;
}

/**
 * 从单个 TypeScript 类型节点中收集 props 名称
 *
 * 递归处理各种类型结构，包括：
 * - 括号类型 (TSParenthesizedType)
 * - 交叉类型和联合类型 (TSIntersectionType, TSUnionType)
 * - 类型引用 (TSTypeReference)
 * - 类型字面量 (TSTypeLiteral)
 *
 * 最终从类型字面量的成员中提取属性签名和方法签名作为 props 名称。
 */
function collectPropsFromTsType(
  tsType: t.TSType,
  names: Set<string>,
  path: NodePath<t.CallExpression>,
  ctx: ICompilationContext,
  visitedTypeRefs: Set<string>,
  warnedImportedTypeRefs: Set<string>,
) {
  // 处理括号类型：递归处理内部的类型注解
  if (t.isTSParenthesizedType(tsType)) {
    collectPropsFromTsType(
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
      collectPropsFromTsType(type, names, path, ctx, visitedTypeRefs, warnedImportedTypeRefs);
    }
    return;
  }

  // 处理类型引用：递归处理泛型参数中的类型
  if (t.isTSTypeReference(tsType)) {
    // 获取类型引用的泛型参数（例如 SomeType<T, U> 中的 T 和 U）
    const innerTypes = tsType.typeParameters?.params || [];

    // 递归处理每个泛型参数类型
    for (const type of innerTypes) {
      collectPropsFromTsType(type, names, path, ctx, visitedTypeRefs, warnedImportedTypeRefs);
    }

    // 尝试解析类型引用指向的本地类型定义（如 interface、type alias）
    const localType = resolveLocalTypeFromReference(
      path,
      tsType,
      ctx,
      MACRO_API_NAMES.props,
      visitedTypeRefs,
      warnedImportedTypeRefs,
    );

    // 如果找到本地类型定义，则递归处理该定义以提取 props
    if (localType) {
      collectPropsFromTsType(localType, names, path, ctx, visitedTypeRefs, warnedImportedTypeRefs);
    }

    return;
  }

  // 只有类型字面量包含我们需要的属性成员
  if (!t.isTSTypeLiteral(tsType)) {
    return;
  }

  // 遍历类型字面量的所有成员，提取属性名
  for (const member of tsType.members) {
    // 只处理属性签名和方法签名（忽略调用签名、构造签名等）
    if (!t.isTSPropertySignature(member) && !t.isTSMethodSignature(member)) {
      continue;
    }

    // 解析静态键名（标识符、字符串字面量等）
    const name = resolveStaticName(member.key as t.Expression | t.PrivateName);
    if (name) {
      names.add(name);
    }
  }
}
