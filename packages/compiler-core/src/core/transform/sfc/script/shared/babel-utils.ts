import { NodePath } from '@babel/traverse';
import * as t from '@babel/types';
import { ICompilationContext } from '@compiler/context/types';
import { stringToExpr } from '@shared/babel-utils';

export function findRootVariablePath(
  path: NodePath<t.MemberExpression | t.OptionalMemberExpression>,
): NodePath<t.VariableDeclarator> | null {
  const rootId = findRootIdentifier(path.node);
  if (!rootId?.name) return null;

  const binding = path.scope.getBinding(rootId.name);
  if (!binding) return null;

  const rootPath = getVariableDeclaratorPath(binding.path);
  return rootPath;
}

export function findRootIdentifier(
  node: t.MemberExpression | t.OptionalMemberExpression,
): t.Identifier | null {
  let current: t.Expression | t.Super = node.object;

  while (t.isMemberExpression(current) || t.isOptionalMemberExpression(current)) {
    current = current.object;
  }

  return t.isIdentifier(current) ? current : null;
}

export function getVariableDeclaratorPath(path: NodePath): NodePath<t.VariableDeclarator> | null {
  if (path.isVariableDeclarator()) {
    return path as NodePath<t.VariableDeclarator>;
  }

  return path.findParent((p) => p.isVariableDeclarator()) as any;
}

export function checkIsCallExpInAnyCallback(path: NodePath<t.CallExpression>): boolean {
  let current = path.parentPath;

  while (current) {
    // 如果当前节点是一个函数
    if (
      current.isFunctionDeclaration() ||
      current.isFunctionExpression() ||
      current.isArrowFunctionExpression()
    ) {
      // 检查这个函数是否是某个调用表达式的参数
      const funcParent = current.parentPath;

      if (funcParent && funcParent.isCallExpression()) {
        const callExp = funcParent.node;

        // 检查这个函数是否是 callExp 的参数之一
        const isArgument = callExp.arguments.some((arg) => arg === current.node);

        if (isArgument) {
          return true;
        }
      }
    }

    // @ts-ignore 继续向上查找
    current = current.parentPath;
  }

  return false;
}

export function isVariableDeclTopLevel(path: NodePath<t.Node>): boolean {
  const variableDeclaratorPath = path;
  const variableDeclarationPath = variableDeclaratorPath.parentPath;

  if (!variableDeclarationPath) {
    return false;
  }

  if (variableDeclarationPath.isProgram()) {
    return true;
  }

  const variableDeclarationParentPath = variableDeclarationPath.parentPath;

  // 变量声明在 Program 下
  if (variableDeclarationParentPath && variableDeclarationParentPath.isProgram()) {
    return true;
  }

  return false;
}

/**
 * 检查标识符是否是真正的变量访问
 */
export function isRealVariableAccess(path: NodePath<t.Identifier>): boolean {
  return isIdentifierAccess(path) && !isPropertyName(path);
}

export function isIdentifierAccess(path: NodePath<t.Identifier>): boolean {
  // 1. 检查是否是声明节点
  if (isIdentifierDeclaration(path)) {
    return false;
  }

  // 2. 检查是否是引用
  const binding = path.scope.getBinding(path.node.name);
  if (!binding) {
    return true; // 没有绑定，肯定是访问（可能是全局变量）
  }

  // 3. 检查是否就是声明节点本身
  return binding.identifier !== path.node;
}

function isIdentifierDeclaration(path: NodePath<t.Identifier>): boolean {
  const parent = path.parentPath;

  if (!parent) return false;

  // 变量声明符的标识符
  if (parent.isVariableDeclarator() && parent.node.id === path.node) {
    return true;
  }

  // 函数声明的标识符
  if (parent.isFunctionDeclaration() && parent.node.id === path.node) {
    return true;
  }

  // 函数表达式的标识符（如果有的话）
  if (parent.isFunctionExpression() && parent.node.id === path.node) {
    return true;
  }

  // 类声明的标识符
  if (parent.isClassDeclaration() && parent.node.id === path.node) {
    return true;
  }

  // 导入声明的标识符
  if (parent.isImportSpecifier() && parent.node.local === path.node) {
    return true;
  }

  if (parent.isImportDefaultSpecifier() && parent.node.local === path.node) {
    return true;
  }

  if (parent.isImportNamespaceSpecifier() && parent.node.local === path.node) {
    return true;
  }

  // 参数声明
  if (parent.isFunction() && parent.node.params.includes(path.node)) {
    return true;
  }

  // Catch 子句参数
  if (parent.isCatchClause() && parent.node.param === path.node) {
    return true;
  }

  return false;
}

/**
 * 检查标识符是否是属性名（不是变量访问）
 */
export function isPropertyName(path: NodePath<t.Identifier>): boolean {
  const parent = path.parentPath;

  if (!parent) return false;

  // 对象属性的键名
  if (parent.isObjectProperty() && parent.node.key === path.node) {
    return true;
  }

  // 类属性的键名
  if (parent.isClassProperty() && parent.node.key === path.node) {
    return true;
  }

  // 成员表达式的属性名
  if (parent.isMemberExpression() && parent.node.property === path.node) {
    return true;
  }

  return false;
}

export function replaceCallName(callExp: t.CallExpression, identifierName: string) {
  const { callee } = callExp;

  if (!t.isIdentifier(callee)) return;

  callee.name = identifierName;

  if (callee.loc) {
    callee.loc.identifierName = identifierName;
  }
}

export function replaceIdName(id: t.Node | null | undefined, newName: string) {
  if (!t.isIdentifier(id)) return;
  id.name = newName;
  if (id.loc) {
    id.loc.identifierName = newName;
  }
}

/**
 * 将对象解析为 ts 类型签名
 *
 * { title: "'name'", count: '1', text: 'greetingMessage', fn: '() => 1' }
 *
 * => { title: string; count: number; text: any; fn: () => number }
 */
export function resolveObjectToTSType(ctx: ICompilationContext, obj: object): t.TSTypeLiteral {
  const properties = Object.entries(obj).map(([key, value]) => {
    const propSignature = t.tsPropertySignature(
      t.stringLiteral(key),
      stringValueToTSType(ctx, String(value), true),
    );
    return propSignature;
  });

  return t.tsTypeLiteral(properties);
}

/**
 * 把字符串 js 值转换成对应 ts 类型
 *
 * Example
 *
 * "'name'" -> string
 *
 * '1' -> number
 *
 * 'greetingMessage' -> any
 *
 * '() => 1' -> () => number
 *
 */
export function stringValueToTSType(
  ctx: ICompilationContext,
  input: string,
  tsTypeAnnotation: true,
): t.TSTypeAnnotation;

export function stringValueToTSType(
  ctx: ICompilationContext,
  input: string,
  tsTypeAnnotation: false,
): t.TSType;

export function stringValueToTSType(
  ctx: ICompilationContext,
  input: string,
  tsTypeAnnotation: true | false,
): t.TSType | t.TSTypeAnnotation {
  const { filename, scriptData } = ctx;
  const exp = stringToExpr(input, scriptData.lang, filename);
  const ts = expressionToTSType(exp);
  return tsTypeAnnotation ? t.tsTypeAnnotation(ts) : ts;
}

/**
 * 把 js 表达式转成对应 ts 类型
 *
 * @param exp babel node
 * @returns {t.TSType}
 */
export function expressionToTSType(exp: t.Expression): t.TSType {
  if (t.isStringLiteral(exp)) return t.tsStringKeyword();
  if (t.isNumericLiteral(exp)) return t.tsNumberKeyword();
  if (t.isBooleanLiteral(exp)) return t.tsBooleanKeyword();
  if (t.isArrayExpression(exp)) return t.tsArrayType(t.tsAnyKeyword());

  if (t.isObjectExpression(exp)) {
    const members: t.TSTypeElement[] = [];
    for (const p of exp.properties) {
      if (!t.isObjectProperty(p)) continue;
      let key: string | undefined;
      if (t.isIdentifier(p.key)) key = p.key.name;
      else if (t.isStringLiteral(p.key)) key = p.key.value;
      if (!key) continue;
      if (t.isExpression(p.value)) {
        members.push(
          t.tsPropertySignature(t.identifier(key), t.tsTypeAnnotation(expressionToTSType(p.value))),
        );
      } else {
        members.push(
          t.tsPropertySignature(t.identifier(key), t.tsTypeAnnotation(t.tsAnyKeyword())),
        );
      }
    }
    return t.tsTypeLiteral(members);
  }

  if (t.isArrowFunctionExpression(exp) || t.isFunctionExpression(exp)) {
    const params = exp.params.map((p, i) => {
      const id = t.isIdentifier(p) ? t.identifier(p.name) : t.identifier(`arg${i}`);
      (id as any).typeAnnotation = t.tsTypeAnnotation(t.tsAnyKeyword());
      return id as any;
    });

    // try infer return type
    let returnType: t.TSType = t.tsAnyKeyword();
    if (t.isBlockStatement(exp.body)) {
      for (const stmt of exp.body.body) {
        if (t.isReturnStatement(stmt) && stmt.argument) {
          if (t.isExpression(stmt.argument)) {
            returnType = expressionToTSType(stmt.argument);
            break;
          }
        }
      }
    } else if (t.isExpression(exp.body)) {
      returnType = expressionToTSType(exp.body);
    }

    return t.tsFunctionType(null, params as any, t.tsTypeAnnotation(returnType));
  }

  // fallback for identifiers, calls, member expressions etc.
  return t.tsAnyKeyword();
}

export function isCalleeNamed(node: t.CallExpression, name: string): boolean {
  if (!t.isIdentifier(node.callee)) {
    return false;
  }

  return node.callee.name === name;
}

/**
 * 判断Babel AST节点是否为简单类型
 * 简单类型包括：字面量
 */
export function isSimpleLiteral(node: t.Node | null | undefined): boolean {
  if (!node) return false;

  if (
    t.isStringLiteral(node) ||
    t.isNumericLiteral(node) ||
    t.isBooleanLiteral(node) ||
    t.isNullLiteral(node) ||
    t.isRegExpLiteral(node) ||
    t.isBigIntLiteral(node) ||
    t.isDecimalLiteral(node)
  ) {
    return true;
  }

  return false;
}

/**
 * 从原节点 “分叉” 出一个新节点，并继承原始节点的注释信息。
 *
 * 注意：这是分叉 + 原节点失效，通常用于原节点要移除的场景。
 *
 * @description
 *
 * 此函数是对 `@babel/types.cloneNode` 的包装，主要增加了注释处理逻辑：
 * 1. 继承原始节点的 leadingComments 和 innerComments
 * 2. 清空原始节点的位置信息和注释，避免重复使用
 *
 * @param node - 要分叉的 AST 节点
 * @param deep - 是否深度克隆，默认为 true
 * @returns 分叉后的新节点
 */
export function forkNode(node: t.Node, deep = true): t.Node {
  const newNode = t.cloneNode(node, deep);

  // 继承原始注释
  newNode.leadingComments = node.leadingComments;
  newNode.innerComments = node.innerComments;

  // 节点的 trailingComments 通常是粘连了相邻节点的 leadingComments
  newNode.trailingComments = null;

  // 清空原始节点信息，防止重复使用
  cleanNodeLoc(node);
  cleanNodeComments(node);

  return newNode;
}

/**
 * 清除节点位置信息
 */
export function cleanNodeLoc(node: t.Node) {
  node.start = null;
  node.end = null;
  node.loc = null;
}

/**
 * 清除节点所有注释
 */
export function cleanNodeComments(node: t.Node) {
  node.leadingComments = null;
  node.innerComments = null;
  node.trailingComments = null;
}
