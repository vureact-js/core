import { parseExpression } from '@babel/parser';
import { NodePath } from '@babel/traverse';
import * as t from '@babel/types';
import { getBabelParseOptions } from '@src/shared/babel-utils';
import { compileContext } from '@src/shared/compile-context';
import { ReactiveTypes, VarDeclKind } from './types';

export function getVarKind(path: NodePath<t.VariableDeclarator>): VarDeclKind {
  const {
    parentPath: { node },
  } = path;
  if (t.isVariableDeclaration(node)) {
    return node.kind;
  }
  return 'const';
}

export function getRootIdByMemberNodePath(
  path: NodePath<t.MemberExpression | t.OptionalMemberExpression>,
): NodePath<t.Identifier> | null {
  let currentNode: t.Expression = path.node;

  // 沿着 object 链向上查找，直到找到标识符
  while (t.isMemberExpression(currentNode) || t.isOptionalMemberExpression(currentNode)) {
    currentNode = currentNode.object;
  }

  // 如果最终找到的是标识符，返回对应的路径
  if (t.isIdentifier(currentNode)) {
    // 需要找到这个标识符的路径
    // 可以通过查找父节点链来找到它
    let currentPath: NodePath | null = path;

    while (currentPath && !(currentPath.isIdentifier() && currentPath.node === currentNode)) {
      if (
        t.isMemberExpression(currentPath.node) ||
        t.isOptionalMemberExpression(currentPath.node)
      ) {
        // 如果当前节点是 MemberExpression，检查它的 object
        if (currentPath.node.object === currentNode) {
          // 返回 object 的路径
          return currentPath.get('object') as NodePath<t.Identifier>;
        }
      }

      // 移动到父路径
      currentPath = currentPath.parentPath;
    }

    if (currentPath?.isIdentifier()) {
      return currentPath as NodePath<t.Identifier>;
    }
  }

  return null;
}

export function getRootIdByNode(node: t.Node): t.Identifier | null {
  // 获取表达式中访问的根标识符
  let rootId: t.Identifier | null = null;

  if (t.isIdentifier(node)) {
    rootId = node;
  } else if (t.isMemberExpression(node) || t.isOptionalMemberExpression(node)) {
    // 遍历获取根标识符
    let current: t.Expression = node;
    while (t.isMemberExpression(current) || t.isOptionalMemberExpression(node)) {
      current = (current as t.MemberExpression).object;
    }
    if (t.isIdentifier(current)) {
      rootId = current;
    }
  }

  return rootId;
}

export interface BabelNodeExtensionMeta {
  isReactive?: boolean;
  reactiveType?: ReactiveTypes;
  getterName?: string;
  setterName?: string;
  isUseRef?: boolean;
}

export function getNodeExtensionMeta(node: t.Node): BabelNodeExtensionMeta {
  return (node as any).__extensionMeta;
}

export function setNodeExtensionMeta(node: t.Node, opts: BabelNodeExtensionMeta) {
  opts.isReactive = opts.isReactive ?? true;
  opts.reactiveType = opts.reactiveType || 'ref';
  (node as any).__extensionMeta = opts;
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

/**
 * 将对象解析为 ts 类型签名
 *
 * { title: "'name'", count: '1', text: 'greetingMessage', fn: '() => 1' }
 *
 * => { title: string; count: number; text: any; fn: () => number }
 */
export function resolveObjectToTSType(obj: object): t.TSTypeLiteral {
  const properties = Object.entries(obj).map(([key, value]) => {
    const propSignature = t.tsPropertySignature(
      t.identifier(key),
      stringValueToTSType(String(value)),
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
 * @returns {t.TSTypeAnnotation}
 */
export function stringValueToTSType(input: string): t.TSTypeAnnotation {
  const exp = parseExp(input);
  const ts = expressionToTSType(exp);
  return t.tsTypeAnnotation(ts);
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

export function parseExp(input: string): t.Expression {
  const { lang, filename } = compileContext.context;
  return parseExpression(input, getBabelParseOptions(lang.script, 'expression', filename));
}

export function isCalleeNamed(node: t.CallExpression, name: string): boolean {
  if (!t.isIdentifier(node.callee)) {
    return false;
  }

  return node.callee.name === name;
}

/**
 * 以当前路径为起点，查找自身的上级父路径节点的变量声明节点
 */
export function getParentVariableDeclarator(path: NodePath): NodePath {
  let current = path;

  while (!current.isVariableDeclarator()) {
    if (current.parentPath) {
      current = current.parentPath;
    } else {
      break;
    }
  }

  return current;
}
