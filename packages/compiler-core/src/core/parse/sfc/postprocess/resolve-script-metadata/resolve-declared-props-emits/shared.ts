import { NodePath } from '@babel/core';
import * as t from '@babel/types';
import { ICompilationContext } from '@compiler/context/types';
import { logger } from '@shared/logger';

export function isJsLikeLang(lang: ICompilationContext['scriptData']['lang']): boolean {
  return lang === 'js' || lang === 'jsx';
}

export function mergeNames(target: Set<string>, names: Iterable<string>) {
  for (const name of names) {
    target.add(name);
  }
}

/**
 * 从 TypeScript 泛型参数中解析出具体的类型节点数组
 *
 * 该函数处理 CallExpression 的 typeParameters 字段，提取其中的类型参数。
 * 支持 TSTypeParameterInstantiation 节点，该节点包含了泛型实例化的具体类型。
 * 如果 typeParameters 为空或不是预期的节点类型，则返回空数组。
 */
export function resolveTsTypes(typeParams: t.CallExpression['typeParameters']): t.TSType[] {
  // 如果泛型参数不存在，直接返回空数组
  if (!typeParams) {
    return [];
  }

  // 处理类型参数实例化节点：返回其 params 字段中的类型数组
  if (t.isTSTypeParameterInstantiation(typeParams)) {
    return typeParams.params;
  }

  // 其他情况（理论上不会发生）返回空数组
  return [];
}

/**
 * 解析对象或数组字面量中的属性名
 *
 * 该函数用于从 defineProps 或 defineEmits 的运行时参数中提取属性名。
 * 支持数组字面量（如 ['prop1', 'prop2']）和对象字面量（如 { prop1: {}, prop2: {} }）。
 */
export function resolveObjectOrArrayLiteralNames(
  value: t.Expression | t.SpreadElement | t.ArgumentPlaceholder | undefined,
): Set<string> {
  const names = new Set<string>();

  // 如果值为空，直接返回空集合
  if (!value) {
    return names;
  }

  // 处理数组表达式：遍历元素，提取字符串字面量作为属性名
  if (t.isArrayExpression(value)) {
    for (const element of value.elements) {
      // 只处理非空且为字符串字面量的元素
      if (element && t.isStringLiteral(element)) {
        names.add(element.value);
      }
    }

    return names;
  }

  // 处理对象表达式：遍历属性，提取键名作为属性名
  if (t.isObjectExpression(value)) {
    for (const property of value.properties) {
      // 只处理对象属性和对象方法（跳过展开运算符等）
      if (!t.isObjectProperty(property) && !t.isObjectMethod(property)) {
        continue;
      }

      // 解析静态键名（标识符、字符串字面量、数字字面量、无插值的模板字符串）
      const name = resolveStaticName(property.key as t.Expression | t.PrivateName);
      if (name) {
        names.add(name);
      }
    }
  }

  return names;
}

/**
 * 解析静态键名
 *
 * 该函数用于从对象属性键或类型成员键中提取静态名称。
 * 支持以下类型的键：
 * - 标识符（Identifier）：返回标识符名称
 * - 字符串字面量（StringLiteral）：返回字符串值
 * - 数字字面量（NumericLiteral）：将数字转换为字符串返回
 * - 无插值的模板字面量（TemplateLiteral）：拼接所有模板元素作为字符串返回
 *
 * 如果键是动态的（如包含表达式的模板字面量、计算属性等），则返回 null。
 */
export function resolveStaticName(key: t.Expression | t.PrivateName): string | null {
  // 处理标识符键：直接返回标识符名称
  if (t.isIdentifier(key)) {
    return key.name;
  }

  // 处理字符串字面量键：直接返回字符串值
  if (t.isStringLiteral(key)) {
    return key.value;
  }

  // 处理数字字面量键：将数字转换为字符串返回
  if (t.isNumericLiteral(key)) {
    return String(key.value);
  }

  // 处理无插值的模板字面量键：拼接所有模板元素作为字符串返回
  if (t.isTemplateLiteral(key) && !key.expressions.length) {
    return key.quasis.map((q) => q.value.cooked || '').join('');
  }

  // 其他情况（动态键、计算属性等）返回 null
  return null;
}

/**
 * 解析同文件内的类型引用。
 *
 * - 命中本地 `interface/type`：返回其类型节点以便继续提取
 * - 命中 `import` 引入：返回 null，并发出 warning（不做跨文件分析）
 * - 其余场景：返回 null
 */
export function resolveLocalTypeFromReference(
  path: NodePath<t.CallExpression>,
  typeRef: t.TSTypeReference,
  ctx: ICompilationContext,
  macroName: string,
  visitedTypeRefs: Set<string>,
  warnedImportedTypeRefs: Set<string>,
): t.TSType | null {
  const refName = resolveTypeReferenceName(typeRef.typeName);

  // 如果无法解析类型引用名称，则返回 null
  if (!refName) return null;

  // 如果该类型引用已被访问过（避免循环引用），则返回 null
  if (visitedTypeRefs.has(refName)) return null;

  // 尝试从当前作用域获取该类型的绑定信息
  const binding = path.scope.getBinding(refName);
  if (binding) {
    // 检查绑定是否为导入的类型（来自外部文件）
    if (
      binding.path.isImportSpecifier() ||
      binding.path.isImportDefaultSpecifier() ||
      binding.path.isImportNamespaceSpecifier()
    ) {
      const key = `${macroName}:${refName}`;

      // 如果尚未警告过此导入类型，则发出警告
      if (!warnedImportedTypeRefs.has(key)) {
        warnedImportedTypeRefs.add(key);

        logger.warn(
          'Type reference comes from an external file. Cross-file analysis is not supported, so it was skipped.',
          {
            file: ctx.filename,
            source: ctx.source,
            loc: typeRef.loc || path.node.loc,
          },
        );
      }

      // 跳过外部导入类型的分析
      return null;
    }

    // 标记该类型引用为已访问
    visitedTypeRefs.add(refName);

    // 处理接口声明：转换为类型字面量
    if (binding.path.isTSInterfaceDeclaration()) {
      return t.tsTypeLiteral(binding.path.node.body.body);
    }

    // 处理类型别名声明：直接返回其类型注解
    if (binding.path.isTSTypeAliasDeclaration()) {
      return binding.path.node.typeAnnotation;
    }
  }

  // Babel 的 scope 在某些 TS 场景下可能拿不到类型绑定，这里补一层同文件 Program 兜底扫描。
  const programPath = path.findParent((p) => p.isProgram());
  if (!programPath?.isProgram()) {
    return null;
  }

  // 在程序体中查找类型声明
  const declaration = resolveTypeDeclarationInProgram(programPath.node.body, refName);
  if (declaration) {
    // 找到同文件内的类型声明，将其标记为已访问并返回
    visitedTypeRefs.add(refName);
    return declaration;
  }

  // 在程序体中查找类型导入
  const importSource = resolveImportedTypeSourceInProgram(programPath.node.body, refName);
  if (importSource) {
    const key = `${macroName}:${refName}`;

    if (!warnedImportedTypeRefs.has(key)) {
      warnedImportedTypeRefs.add(key);

      logger.warn(
        'Type reference comes from an external file. Cross-file analysis is not supported, so it was skipped.',
        {
          file: ctx.filename,
          source: ctx.source,
          loc: typeRef.loc || path.node.loc,
        },
      );
    }

    // 类型来自外部文件，跳过分析
    return null;
  }

  // 未找到任何匹配的类型声明或导入
  return null;
}

function resolveTypeReferenceName(typeName: t.TSEntityName): string | null {
  if (t.isIdentifier(typeName)) {
    return typeName.name;
  }

  return null;
}

function resolveTypeDeclarationInProgram(body: t.Statement[], typeName: string): t.TSType | null {
  // 遍历程序体中的所有语句
  for (const statement of body) {
    // 检查是否为 TS 接口声明且名称匹配
    if (t.isTSInterfaceDeclaration(statement) && statement.id.name === typeName) {
      // 将接口体转换为类型字面量
      return t.tsTypeLiteral(statement.body.body);
    }

    // 检查是否为 TS 类型别名声明且名称匹配
    if (t.isTSTypeAliasDeclaration(statement) && statement.id.name === typeName) {
      // 直接返回类型注解
      return statement.typeAnnotation;
    }

    // 如果不是具名导出声明或没有声明部分，则跳过
    if (!t.isExportNamedDeclaration(statement) || !statement.declaration) {
      continue;
    }

    const declaration = statement.declaration;

    // 检查导出声明中的 TS 接口声明
    if (t.isTSInterfaceDeclaration(declaration) && declaration.id.name === typeName) {
      return t.tsTypeLiteral(declaration.body.body);
    }

    // 检查导出声明中的 TS 类型别名声明
    if (t.isTSTypeAliasDeclaration(declaration) && declaration.id.name === typeName) {
      return declaration.typeAnnotation;
    }
  }

  // 未找到匹配的类型声明
  return null;
}

function resolveImportedTypeSourceInProgram(body: t.Statement[], typeName: string): string | null {
  for (const statement of body) {
    // 只处理导入声明
    if (!t.isImportDeclaration(statement)) {
      continue;
    }

    // 检查是否有导入说明符匹配目标类型名
    const imported = statement.specifiers.some((specifier) => {
      // 检查本地绑定名称是否匹配
      if (!specifier.local || specifier.local.name !== typeName) {
        return false;
      }

      // 如果是 ImportSpecifier，需要检查是否为类型导入
      if (t.isImportSpecifier(specifier)) {
        return specifier.importKind === 'type' || statement.importKind === 'type';
      }

      // 其他说明符类型（默认导入、命名空间导入）直接返回 true
      return true;
    });

    // 如果找到匹配的导入，返回导入源路径
    if (imported) {
      return statement.source.value;
    }
  }

  // 未找到匹配的导入
  return null;
}
