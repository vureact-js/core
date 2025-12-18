import { NodePath, traverse } from '@babel/core';
import * as t from '@babel/types';
import { reactHookVarDecl } from './builders/react-hook-variable-declaration';
import { getRootIdentifier, isReferencedIdentifier } from './shared/babel-utils';

export function analyzeFunctionDependencies(
  fnBody: t.Expression | t.BlockStatement,
  parentPath: NodePath,
): t.ArrayExpression {
  const dependencies = new Set<string>();
  const processedIdentifiers = new WeakSet<t.Identifier>();

  traverse(
    fnBody,
    {
      MemberExpression(memberPath) {
        const dep = analyzeMemberExpDep(memberPath);

        if (!dep) return;
        dependencies.add(dep);

        // 标记根标识符已被处理
        const rootIdentifier = getRootIdentifier(memberPath);
        if (rootIdentifier) {
          processedIdentifiers.add(rootIdentifier.node);
        }
      },

      Identifier(innerPath) {
        // 跳过已被 MemberExpression 处理的标识符
        if (processedIdentifiers.has(innerPath.node)) return;
        const dep = analyzeIdentifierDep(innerPath);
        if (dep) dependencies.add(dep);
      },
    },
    parentPath.scope, // 在收集依赖时，必须按照作用域链查找
  );

  const arr = Array.from(dependencies).map((str) =>
    str.includes('.') ? t.stringLiteral(str) : t.identifier(str),
  );

  return t.arrayExpression(arr);
}

export function analyzeMemberExpDep(path: NodePath<t.MemberExpression>): string | undefined {
  // 获取根标识符
  const rootIdentifier = getRootIdentifier(path);
  if (!rootIdentifier) return;

  const rootName = rootIdentifier.node.name;

  // 查找根标识符的绑定
  const binding = rootIdentifier.scope.getBinding(rootName);
  if (!binding || !isReactiveBinding(binding.path)) {
    return; // 根变量不是响应式变量
  }

  // 构建属性访问链
  const propertyChain = getPropertyChain(path.node);

  let dependencyPath = rootName;

  if (propertyChain.length) {
    propertyChain.forEach((prop) => {
      dependencyPath += typeof prop === 'number' ? `[${prop}]` : `.${prop}`;
    });
  }

  return dependencyPath;
}

export function analyzeIdentifierDep(path: NodePath<t.Identifier>): string | undefined {
  // 判断是否是作为变量被引用
  if (!isReferencedIdentifier(path)) return;

  const name = path.node.name;

  // 查找变量标识符的绑定源
  const binding = path.scope.getBinding(name);

  // 确保源是变量声明式
  if (binding && isReactiveBinding(binding.path)) {
    return name;
  }
}

function getPropertyChain(node: t.MemberExpression): string[] {
  const properties: (string | number)[] = [];
  let current: t.Expression = node;

  // 递归倒序收集属性链
  while (t.isMemberExpression(current)) {
    if (t.isIdentifier(current.property)) {
      properties.push(current.property.name);
    } else if (t.isStringLiteral(current.property) || t.isNumericLiteral(current.property)) {
      properties.push(current.property.value);
    } else {
      // 对于其他类型的属性，我们无法处理，返回空

      return [];
    }
    current = current.object;
  }

  // 属性链回归正序
  return (properties as string[]).reverse();
}

function isReactiveBinding(path: NodePath): boolean {
  const { node } = path;

  // 确保源是变量声明式
  if (t.isVariableDeclaration(node)) {
    // 查找节点拓展元是否已标记为响应式
    const { isReactive } = reactHookVarDecl.getExtensionMeta(node);
    return !!isReactive;
  }

  return false;
}
