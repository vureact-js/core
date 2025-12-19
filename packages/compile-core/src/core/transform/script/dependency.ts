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
      'MemberExpression|OptionalMemberExpression'(memberPath) {
        const path = memberPath as NodePath<t.MemberExpression | t.OptionalMemberExpression>;
        const dep = analyzeMemberExpDep(path);

        if (!dep) return;
        dependencies.add(dep);

        // 标记根标识符已被处理
        const rootIdentifier = getRootIdentifier(path);
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

  const ids = Array.from(dependencies).map(t.identifier);
  return t.arrayExpression(ids);
}

export function analyzeMemberExpDep(
  path: NodePath<t.MemberExpression | t.OptionalMemberExpression>,
): string | undefined {
  const rootName = findRootIdIsReactive(path);

  if (!rootName) return;

  // 构建属性访问链
  const propertyChain = getPropertyChain(path.node);

  let dependencyPath = rootName;

  propertyChain.forEach(({ name, optional }) => {
    if (typeof name === 'number') {
      dependencyPath += `[${name}]`;
      return;
    }

    if (typeof name === 'string') {
      const optionalFlag = optional ? '?' : '';
      dependencyPath += `${optionalFlag}.${name}`;
    }
  });

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

type PropertyChains = { name: string | number; optional: boolean };

function getPropertyChain(node: t.MemberExpression | t.OptionalMemberExpression): PropertyChains[] {
  const properties: PropertyChains[] = [];

  let current: t.Expression = node;

  // 递归倒序收集属性链
  while (t.isMemberExpression(current) || t.isOptionalMemberExpression(current)) {
    const prop: PropertyChains = {
      name: '',
      optional: !!current.optional,
    };

    const { property } = current;

    if (t.isIdentifier(property)) {
      prop.name = property.name;
    } else if (t.isStringLiteral(property) || t.isNumericLiteral(property)) {
      prop.name = property.value;
    } else {
      // 对于其他类型的属性，我们无法处理，返回空
      return [];
    }

    properties.push(prop);
    current = current.object;
  }

  // 属性链回归正序
  return properties.reverse();
}

function findRootIdIsReactive(
  path: NodePath<t.MemberExpression | t.OptionalMemberExpression>,
): string | undefined {
  // 获取根标识符
  const rootIdentifier = getRootIdentifier(path);
  if (!rootIdentifier) return;

  const rootName = rootIdentifier.node.name;

  // 查找根标识符的绑定
  const binding = rootIdentifier.scope.getBinding(rootName);
  if (!binding || !isReactiveBinding(binding.path)) {
    return; // 根变量不是响应式变量
  }

  return rootName;
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
