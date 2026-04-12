import { NodePath } from '@babel/traverse';
import * as t from '@babel/types';
import { ICompilationContext } from '@compiler/context/types';
import { PACKAGE_NAME } from '@consts/other';
import { REACT_API_MAP } from '@consts/react-api-map';
import { recordImport } from '@transform/shared';
import { ILocalTypeDeclaration } from './types';

// 记录需要导入 React.ReactNode
export function recordReactNode(ctx: ICompilationContext) {
  // 非 ts 环境不导入
  if (!ctx.scriptData.lang.startsWith('ts')) {
    return;
  }
  recordImport(ctx, PACKAGE_NAME.react, REACT_API_MAP.ReactNode);
}

/**
 * 收集当前文件中的本地类型声明（接口和类型别名）
 * 包括顶层声明和命名导出的声明
 *
 * @param path - 调用表达式的路径，用于查找所属的 Program 节点
 * @returns 返回一个映射表，键为类型名称，值为类型声明信息
 */
export function collectLocalTypeDeclarations(
  path: NodePath<t.CallExpression>,
): Map<string, ILocalTypeDeclaration> {
  const declarations = new Map<string, ILocalTypeDeclaration>();

  // 查找当前节点所属的 Program 节点
  const programPath = path.findParent((parentPath): parentPath is NodePath<t.Program> =>
    parentPath.isProgram(),
  );

  if (!programPath) {
    return declarations;
  }

  // 遍历 Program 的所有语句
  for (const statement of (programPath.node as t.Program).body) {
    // 处理顶层接口声明
    if (t.isTSInterfaceDeclaration(statement)) {
      declarations.set(statement.id.name, {
        type: t.tsTypeLiteral(statement.body.body), // 将接口体转换为类型字面量
        hasTypeParameters: !!statement.typeParameters?.params.length, // 检查是否有泛型参数
      });
      continue;
    }

    // 处理顶层类型别名声明
    if (t.isTSTypeAliasDeclaration(statement)) {
      declarations.set(statement.id.name, {
        type: statement.typeAnnotation, // 直接使用类型注解
        hasTypeParameters: !!statement.typeParameters?.params.length, // 检查是否有泛型参数
      });
      continue;
    }

    // 处理命名导出的声明
    if (t.isExportNamedDeclaration(statement) && statement.declaration) {
      const declaration = statement.declaration;

      if (t.isTSInterfaceDeclaration(declaration)) {
        declarations.set(declaration.id.name, {
          type: t.tsTypeLiteral(declaration.body.body), // 将接口体转换为类型字面量
          hasTypeParameters: !!declaration.typeParameters?.params.length, // 检查是否有泛型参数
        });
      } else if (t.isTSTypeAliasDeclaration(declaration)) {
        declarations.set(declaration.id.name, {
          type: declaration.typeAnnotation, // 直接使用类型注解
          hasTypeParameters: !!declaration.typeParameters?.params.length, // 检查是否有泛型参数
        });
      }
    }
  }

  return declarations;
}

export function resolvePropName(key: t.Expression | t.PrivateName): string | null {
  // 处理标识符：直接返回名称
  if (t.isIdentifier(key)) {
    return key.name;
  }

  // 处理字符串字面量：返回字符串值
  if (t.isStringLiteral(key)) {
    return key.value;
  }

  // 处理数字字面量：转换为字符串返回
  if (t.isNumericLiteral(key)) {
    return String(key.value);
  }

  // 其他情况（如计算属性名）返回 null
  return null;
}

export function resolveCallableType(tsType: t.TSType): t.TSFunctionType | null {
  // 如果已经是函数类型，直接返回
  if (t.isTSFunctionType(tsType)) {
    return tsType;
  }

  // 如果是括号类型，递归解析内部类型
  if (t.isTSParenthesizedType(tsType)) {
    return resolveCallableType(tsType.typeAnnotation);
  }

  // 其他类型无法解析为可调用类型
  return null;
}
