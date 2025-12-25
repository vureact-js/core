import { NodePath, traverse } from '@babel/core';
import * as t from '@babel/types';
import { React_Hooks, RuntimeModules } from '@consts/runtimeModules';
import { recordImport } from '@shared/runtime-utils';
import { ScriptBlockIR } from '..';
import { reactHookBuilder } from '../builders/react-hook-builder';
import { analyzeFuncBodyDeps } from '../shared/analyze-dependency';
import { setNodeExtensionMeta } from '../shared/babel-utils';
import { warnVueHookInBlock } from '../shared/unsupported-warn';

export function optimizationFunction(ast: ScriptBlockIR) {
  traverse(ast, {
    Function(path) {
      transformToUseCallback(path);
    },
  });
}

function transformToUseCallback(path: NodePath<t.Function>) {
  const { node, parent } = path;

  if (t.isFunctionDeclaration(node) || isCallbackFunction(path) || !isTopLevel(path)) return;

  warnVueHookInBlock(path);
  recordImport(RuntimeModules.REACT, React_Hooks.useCallback, true);

  const deps = analyzeFuncBodyDeps(node.body, path);
  const newNode = reactHookBuilder.useCallback(node, deps);

  // 不论有无依赖都标记为间接响应式，只因是 useCallback
  if (t.isVariableDeclarator(parent)) {
    setNodeExtensionMeta(parent, { isReactive: true, reactiveType: 'indirect' });
  }

  path.replaceWith(newNode);
}

function isTopLevel(path: NodePath<t.Function>): boolean {
  const node = path.node;

  // 获取函数节点所在的父节点路径
  const parentPath = path.parentPath;

  if (!parentPath) {
    return false;
  }

  // 箭头函数或函数表达式
  if (t.isArrowFunctionExpression(node) || t.isFunctionExpression(node)) {
    return checkArrowOrFunctionExpressionTopLevel(path);
  }

  return false;
}

function checkArrowOrFunctionExpressionTopLevel(path: NodePath<t.Function>): boolean {
  const parentPath = path.parentPath;

  if (!parentPath) {
    return false;
  }

  // 情况1：作为变量声明的初始值
  if (parentPath.isVariableDeclarator()) {
    const variableDeclaratorPath = parentPath as NodePath<t.VariableDeclarator>;
    const variableDeclarationPath =
      variableDeclaratorPath.parentPath as NodePath<t.VariableDeclaration>;

    if (!variableDeclarationPath) {
      return false;
    }

    const variableDeclarationParentPath = variableDeclarationPath.parentPath;

    // 变量声明在 Program 下
    if (variableDeclarationParentPath && variableDeclarationParentPath.isProgram()) {
      return true;
    }

    // 变量声明在导出声明中
    if (
      variableDeclarationParentPath &&
      (variableDeclarationParentPath.isExportNamedDeclaration() ||
        variableDeclarationParentPath.isExportDefaultDeclaration())
    ) {
      const exportParent = variableDeclarationParentPath.parentPath;
      return exportParent ? exportParent.isProgram() : false;
    }
  }

  // 情况2：作为对象属性的值（方法）
  if (parentPath.isObjectProperty()) {
    const objectPropertyPath = parentPath as NodePath<t.ObjectProperty>;
    const objectExpressionPath = objectPropertyPath.parentPath as NodePath<t.ObjectExpression>;

    if (!objectExpressionPath) {
      return false;
    }

    // 检查对象表达式是否在顶层
    return checkExpressionTopLevel(objectExpressionPath);
  }

  // 情况3：作为类方法
  if (parentPath.isClassMethod()) {
    const classMethodPath = parentPath as NodePath<t.ClassMethod>;
    const classBodyPath = classMethodPath.parentPath as NodePath<t.ClassBody>;

    if (!classBodyPath) {
      return false;
    }

    const classDeclarationPath = classBodyPath.parentPath as NodePath<t.ClassDeclaration>;

    if (!classDeclarationPath) {
      return false;
    }

    // 检查类声明是否在顶层
    return checkExpressionTopLevel(classDeclarationPath);
  }

  // 情况4：作为赋值表达式的右值
  if (parentPath.isAssignmentExpression()) {
    const assignmentExpressionPath = parentPath as NodePath<t.AssignmentExpression>;
    return checkExpressionTopLevel(assignmentExpressionPath);
  }

  // 其他情况：回调函数、立即执行函数等都不是顶层函数
  return false;
}

// 辅助函数：检查表达式是否为顶层
function checkExpressionTopLevel(path: NodePath<t.Node>): boolean {
  let current = path;

  while (current.parentPath) {
    const parent = current.parentPath;

    // 如果遇到以下情况，说明不是顶层
    if (
      parent.isFunction() ||
      parent.isArrowFunctionExpression() ||
      parent.isClassMethod() ||
      parent.isObjectMethod()
    ) {
      return false;
    }

    // 如果到达 Program，说明是顶层
    if (parent.isProgram()) {
      return true;
    }

    // 继续向上
    current = parent;
  }

  return current.isProgram();
}

function isCallbackFunction(path: NodePath<t.Function>): boolean {
  const parentPath = path.parentPath;

  if (!parentPath) {
    return false;
  }

  // 如果父节点是调用表达式，并且这个函数是参数之一，那么它是回调
  if (parentPath.isCallExpression()) {
    const callExpressionPath = parentPath as NodePath<t.CallExpression>;
    const args = callExpressionPath.node.arguments;

    // 检查这个函数节点是否是调用表达式的参数
    return args.some((arg) => arg === path.node);
  }

  // 如果父节点是数组表达式，可能也是回调
  if (parentPath.isArrayExpression()) {
    const arrayExpressionPath = parentPath as NodePath<t.ArrayExpression>;
    const elements = arrayExpressionPath.node.elements;

    // 检查这个函数节点是否是数组的元素
    return elements.some((element) => element === path.node);
  }

  return false;
}
