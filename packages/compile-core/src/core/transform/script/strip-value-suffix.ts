// strip-value-suffix.ts
import { NodePath, traverse } from '@babel/core';
import * as t from '@babel/types';
import { compileContext } from '@shared/compile-context';
import { logger } from '@shared/logger';
import { ScriptBlockIR } from '.';
import { getRootIdentifier } from './shared/babel-utils';
import { ReactiveTypes } from './shared/types';

const VALUE_SUFFIX_APIS = new Set<ReactiveTypes>([
  'ref',
  'shallowRef',
  'customRef',
  'computed',
  'toRef',
  'toRefs',
]);

/*
 * 处理特殊情况：链式访问中的 .value
 * 例如：obj.value.a.b.c，会剥离 .value，变成 obj.a.b.c
 * 只处理最外层的 .value，内层的 .value 不会重复处理
 * 因为是深度优先遍历，处理完外层后内层已经不存在 .value 了
 * 
 * 处理边界情况：
 * 1. 动态属性访问：obj.value[someKey] → obj[someKey]
 * 2. 计算属性：obj.value['value'] → obj['value']
 * 3. 嵌套访问：obj.value.a.value.b → obj.a.b（会处理两次）

 * 对于 toRefs 的情况，访问 obj.a.value 中的 obj 必须是 toRefs 返回的对象
 */
export function stripReactiveValueSuffix(ast: ScriptBlockIR) {
  traverse(ast, {
    // 处理普通成员表达式：obj.value, obj.value.prop
    MemberExpression(path) {
      processMemberExpression(path);
    },

    // 处理可选链表达式：obj?.value, obj?.value?.prop
    OptionalMemberExpression(path) {
      processOptionalMemberExpression(path);
    },

    // 处理 TypeScript 非空断言：obj!.value, obj!.value!.prop
    TSNonNullExpression(path) {
      processNonNullExpression(path);
    },
  });
}

function processMemberExpression(path: NodePath<t.MemberExpression>) {
  // 检查是否是 .value 访问
  if (!isValuePropertyAccess(path)) return;

  // 获取根标识符
  const rootIdentifier = getRootIdentifier(path);
  if (!rootIdentifier) return;

  // 检查根标识符是否来自需要剥离 .value 的 API
  if (!isFromValueSuffixAPI(rootIdentifier)) return;

  // 剥离 .value：用 object 部分替换整个表达式
  const objectPath = path.get('object');
  path.replaceWith(objectPath.node);

  // 继续处理可能嵌套的 .value（如 obj.value.value）
  // traverse 会自动继续遍历新的节点
}

function processOptionalMemberExpression(path: NodePath<t.OptionalMemberExpression>) {
  // 检查是否是 .value 访问
  if (!isValuePropertyAccess(path)) return;

  // 获取根标识符
  const rootIdentifier = getRootIdentifier(path);
  if (!rootIdentifier) return;

  // 检查根标识符是否来自需要剥离 .value 的 API
  if (!isFromValueSuffixAPI(rootIdentifier)) return;

  // 剥离 .value，但保持可选链
  const objectPath = path.get('object');

  // 如果 object 部分是标识符，直接替换为标识符
  if (objectPath.isIdentifier()) {
    // 对于可选链，不能直接去掉 .value，因为 obj?.value 变成 obj 会改变语义
    // 实际上，obj?.value 中 obj 是 ref，剥离 .value 后应该是 obj（可选访问 ref 本身）
    // 这是正确的，因为 ref 本身可能为 null/undefined
    path.replaceWith(objectPath.node);
  } else if (objectPath.isMemberExpression()) {
    // 如果 object 部分也是成员表达式，保持可选链
    const newNode = t.optionalMemberExpression(
      objectPath.node.object,
      objectPath.node.property as t.Expression,
      objectPath.node.computed,
      objectPath.node.optional ?? false,
    );
    path.replaceWith(newNode);
  }
}

function processNonNullExpression(path: NodePath<t.TSNonNullExpression>) {
  const expression = path.get('expression');

  // 检查内部表达式是否是 .value 访问
  if (expression.isMemberExpression()) {
    if (!isValuePropertyAccess(expression)) return;

    const rootIdentifier = getRootIdentifier(expression);
    if (!rootIdentifier) return;

    if (!isFromValueSuffixAPI(rootIdentifier)) return;

    // 剥离 .value，但保持非空断言
    const objectPath = expression.get('object');
    const newNode = t.tsNonNullExpression(objectPath.node);
    path.replaceWith(newNode);
  }
}

function isValuePropertyAccess(
  path: NodePath<t.MemberExpression | t.OptionalMemberExpression>,
): boolean {
  const property = path.node.property;

  // 检查属性名是否是 'value'
  if (t.isIdentifier(property)) {
    return property.name === 'value';
  }

  if (t.isStringLiteral(property) || t.isNumericLiteral(property)) {
    return property.value === 'value';
  }

  const { source, filename } = compileContext.context;

  // 对于计算属性访问，如 obj[valueKey]，无法静态确定，跳过
  if (path.node.computed) {
    logger.warn('Skip computed property accesses that cannot be statically determined.', {
      source,
      file: filename,
      loc: property.loc!,
    });
  } else {
    logger.warn('Unhandled property type.', {
      source,
      file: filename,
      loc: property.loc!,
    });
  }

  return false;
}

function isFromValueSuffixAPI(path: NodePath<t.Identifier>): boolean {
  const name = path.node.name;
  const binding = path.scope.getBinding(name);

  if (!binding) return false;

  // 检查绑定是否来自变量声明
  if (binding.path.isVariableDeclarator()) {
    const init = binding.path.node.init;

    // 检查初始化是否是一个函数调用，且函数名在 VALUE_SUFFIX_APIS 中
    if (t.isCallExpression(init) && t.isIdentifier(init.callee)) {
      return VALUE_SUFFIX_APIS.has(init.callee.name as any);
    }
  }

  // 检查绑定是否来自函数参数（toRef/toRefs 解构的情况）
  if (binding.path.isObjectPattern()) {
    // 尝试找到父级变量声明
    const parentDeclarator = binding.path.parentPath;
    if (parentDeclarator?.isVariableDeclarator()) {
      const parentInit = parentDeclarator.node.init;
      if (t.isCallExpression(parentInit) && t.isIdentifier(parentInit.callee)) {
        // 检查是否是 toRefs 调用
        return parentInit.callee.name === 'toRefs';
      }
    }
  }

  return false;
}
