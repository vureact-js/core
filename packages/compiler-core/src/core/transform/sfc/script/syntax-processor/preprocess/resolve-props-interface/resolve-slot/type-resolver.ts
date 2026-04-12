import * as t from '@babel/types';
import { cloneCallableParams } from '../shared';
import { buildSlotPropSignature } from './slot-builder';
import { ISlotMemberResolveResult, ISlotTypeResolveOptions, ISlotTypeResolveResult } from './types';
import { resolveCallableType, resolvePropName } from './utils';

const SLOT_DEFAULT_NAME = 'default';

// 将 defineSlots<T> 中显式声明或可追溯的本地类型，转换为 slot props 类型。
export function resolveSlotType(
  tsType: t.TSType,
  options: ISlotTypeResolveOptions,
): ISlotTypeResolveResult {
  // 处理括号类型：跳过括号，直接处理内部的类型注解
  if (t.isTSParenthesizedType(tsType)) {
    return resolveSlotType(tsType.typeAnnotation, options);
  }

  // 处理类型引用（包括泛型实例化和本地类型别名）
  if (t.isTSTypeReference(tsType)) {
    let shouldRecordReactNode = false;

    // 处理泛型类型引用（如 SlotProps<T>）
    if (tsType.typeParameters?.params.length) {
      const params: t.TSType[] = [];

      // 递归处理每个类型参数
      for (const param of tsType.typeParameters.params) {
        const resolved = resolveSlotType(param, options);

        shouldRecordReactNode = shouldRecordReactNode || resolved.shouldRecordReactNode;

        // 保留解析后的类型，如果解析失败则使用原始参数
        params.push(resolved.type || param);
      }

      // 如果类型参数中都不包含可调用类型，则整个类型引用也不记录 ReactNode
      if (!shouldRecordReactNode) {
        return {
          type: tsType,
          shouldRecordReactNode: false,
        };
      }

      // 重新构建带有处理后的类型参数的类型引用
      return {
        type: t.tsTypeReference(tsType.typeName, t.tsTypeParameterInstantiation(params)),
        shouldRecordReactNode,
      };
    }

    // 非标识符的类型名称（如 QualifiedName）不处理
    if (!t.isIdentifier(tsType.typeName)) {
      return {
        type: tsType,
        shouldRecordReactNode: false,
      };
    }

    const typeName = tsType.typeName.name;
    const localDeclaration = options.localTypeDeclarations.get(typeName);

    // 跳过以下情况：
    // 1. 非本地声明（import/外部类型）
    // 2. 泛型类型声明（避免语义猜测）
    if (!localDeclaration || localDeclaration.hasTypeParameters) {
      return {
        type: tsType,
        shouldRecordReactNode: false,
      };
    }

    // 防止循环引用：如果当前类型名已在访问路径中，则跳过
    if (options.visitedTypeNames.has(typeName)) {
      return {
        type: tsType,
        shouldRecordReactNode: false,
      };
    }

    // 递归解析本地类型别名
    options.visitedTypeNames.add(typeName);
    const resolved = resolveSlotType(localDeclaration.type, options);
    options.visitedTypeNames.delete(typeName);

    // 如果解析结果不包含可调用类型，则返回原始类型引用
    if (!resolved.shouldRecordReactNode) {
      return {
        type: tsType,
        shouldRecordReactNode: false,
      };
    }

    // 返回解析结果（可能是原始类型或转换后的类型）
    return resolved;
  }

  // 处理交集类型（如 A & B）
  if (t.isTSIntersectionType(tsType)) {
    const types: t.TSType[] = [];
    let shouldRecordReactNode = false;

    // 递归处理交集中的每个类型
    for (const item of tsType.types) {
      const resolved = resolveSlotType(item, options);

      // 只要有一个类型需要记录 ReactNode，整个交集就需要记录
      shouldRecordReactNode = shouldRecordReactNode || resolved.shouldRecordReactNode;

      // 保留解析后的类型，如果解析失败则跳过
      if (resolved.type) {
        types.push(resolved.type);
      }
    }

    // 如果没有有效的类型，返回 null
    if (!types.length) {
      return {
        type: null,
        shouldRecordReactNode,
      };
    }

    // 如果只有一个有效类型，直接返回该类型（简化结构）
    if (types.length === 1) {
      return {
        type: types[0]!,
        shouldRecordReactNode,
      };
    }

    // 重新构建交集类型
    return {
      type: t.tsIntersectionType(types),
      shouldRecordReactNode,
    };
  }

  // 处理联合类型（如 A | B）
  if (t.isTSUnionType(tsType)) {
    const types: t.TSType[] = [];
    let shouldRecordReactNode = false;

    // 递归处理联合类型中的每个成员类型
    for (const item of tsType.types) {
      const resolved = resolveSlotType(item, options);

      // 只要有一个成员类型需要记录 ReactNode，整个联合类型就需要记录
      shouldRecordReactNode = shouldRecordReactNode || resolved.shouldRecordReactNode;

      // 保留解析成功的类型，解析失败则跳过
      if (resolved.type) {
        types.push(resolved.type);
      }
    }

    // 如果没有有效的类型成员，返回 null
    if (!types.length) {
      return {
        type: null,
        shouldRecordReactNode,
      };
    }

    // 如果只有一个有效类型成员，直接返回该类型（简化结构）
    if (types.length === 1) {
      return {
        type: types[0]!,
        shouldRecordReactNode,
      };
    }

    // 重新构建联合类型
    return {
      type: t.tsUnionType(types),
      shouldRecordReactNode,
    };
  }

  // 处理对象字面量类型（如 { foo: (p: T) => void; bar?: (p: U) => void }）
  if (t.isTSTypeLiteral(tsType)) {
    const members: t.TSTypeElement[] = [];
    let shouldRecordReactNode = false;

    // 遍历对象类型的每个成员（属性/方法/调用签名）
    for (const item of tsType.members) {
      // 将成员解析为 slot 的属性签名
      const resolved = resolveSlotPropFromMember(item);

      // 只要有一个成员需要记录 ReactNode，整个对象类型就需要记录
      shouldRecordReactNode = shouldRecordReactNode || resolved.shouldRecordReactNode;

      // 使用解析后的成员（若解析成功）或保留原始成员
      members.push(resolved.member || item);
    }

    // 如果没有有效的成员，返回 null
    if (!members.length) {
      return {
        type: null,
        shouldRecordReactNode,
      };
    }

    // 重新构建对象字面量类型
    return {
      type: t.tsTypeLiteral(members),
      shouldRecordReactNode,
    };
  }

  // 处理函数类型（如 (p: T) => void）
  // 函数类型表示默认插槽，将其转换为包含默认插槽属性的对象类型
  if (t.isTSFunctionType(tsType)) {
    // 构建默认插槽的属性签名
    const props = buildSlotPropSignature(
      SLOT_DEFAULT_NAME,
      cloneCallableParams(tsType.parameters),
      false, // 默认插槽不是可选的
    );

    // 返回包含该属性签名的对象字面量类型
    return {
      type: t.tsTypeLiteral([props]),
      shouldRecordReactNode: true, // 函数类型总是需要记录 ReactNode
    };
  }

  // 对于其他未处理的类型，返回原始类型且不记录 ReactNode
  return {
    type: tsType,
    shouldRecordReactNode: false,
  };
}

// 从类型成员（方法/属性/调用签名）解析为 slot 的属性签名
export function resolveSlotPropFromMember(member: t.TSTypeElement): ISlotMemberResolveResult {
  // 处理方法签名（如 foo(p: T): void）
  if (t.isTSMethodSignature(member)) {
    // 解析方法名，若无法解析则返回失败
    const rawName = resolvePropName(member.key);

    if (!rawName) {
      return {
        member: null,
        shouldRecordReactNode: false,
      };
    }

    // 克隆方法参数，构建对应的 slot 属性签名
    const params = cloneCallableParams(member.parameters);
    
    return {
      member: buildSlotPropSignature(rawName, params, !!member.optional),
      shouldRecordReactNode: true, // 方法签名总是可调用，需要记录 ReactNode
    };
  }

  // 处理属性签名（如 foo?: (p: T) => void）
  if (t.isTSPropertySignature(member)) {
    // 解析属性名，若无法解析则返回失败
    const rawName = resolvePropName(member.key as t.Expression);

    if (!rawName) {
      return {
        member: null,
        shouldRecordReactNode: false,
      };
    }

    // 获取属性类型注解，并尝试解析为可调用类型
    const typeAnnotation = member.typeAnnotation?.typeAnnotation;
    const callable = typeAnnotation ? resolveCallableType(typeAnnotation) : null;

    // 若类型不是可调用类型，则返回失败
    if (!callable) {
      return {
        member: null,
        shouldRecordReactNode: false,
      };
    }

    // 克隆可调用类型的参数，构建对应的 slot 属性签名
    const params = cloneCallableParams(callable.parameters);

    return {
      member: buildSlotPropSignature(rawName, params, !!member.optional),
      shouldRecordReactNode: true, // 可调用属性需要记录 ReactNode
    };
  }

  // 处理调用签名（如 (p: T): void）
  if (t.isTSCallSignatureDeclaration(member)) {
    // 克隆调用签名参数，构建默认插槽的属性签名
    const params = cloneCallableParams(member.parameters);

    return {
      member: buildSlotPropSignature(SLOT_DEFAULT_NAME, params, true),
      shouldRecordReactNode: true, // 调用签名总是可调用，需要记录 ReactNode
    };
  }

  // 对于其他类型的成员，无法解析为 slot 属性
  return {
    member: null,
    shouldRecordReactNode: false,
  };
}
