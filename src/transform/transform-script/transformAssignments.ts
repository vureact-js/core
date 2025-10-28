import type { NodePath } from '@babel/traverse';
import traverse from '@babel/traverse';
import * as t from '@babel/types';
import { createSetterName } from '@transform/utils';
import type { ScriptTransformContext } from './types';

// 全面处理 Vue 响应式赋值到 useImmer 的转换
// 1.全面覆盖：处理所有赋值操作符和更新表达式
// 2.深度访问：支持任意深度的嵌套属性访问
// 3.动态属性：处理计算属性名和数组索引
// 4.数组方法：转换常见的数组变异方法
// Handling the transform from Vue reactive assignment to useImmer
export function transformAssignments(ast: t.File, ctx: ScriptTransformContext) {
  const replacements: Array<{
    path: NodePath<t.Expression>;
    replacement: t.Expression | t.Statement;
  }> = [];
  traverse(ast, {
    // 处理普通赋值表达式
    AssignmentExpression(path) {
      const { node } = path;

      // 检查是否为响应式变量的赋值
      if (isReactiveAssignment(node.left, ctx)) {
        const replacement = handleAssignmentExpression(node, ctx);
        if (replacement) {
          replacements.push({ path, replacement });
        }
      }
    },

    // 处理更新表达式 (++, --)
    UpdateExpression(path) {
      const { node } = path;

      if (isReactiveUpdate(node.argument, ctx)) {
        const replacement = handleUpdateExpression(node, ctx);
        if (replacement) {
          replacements.push({ path, replacement });
        }
      }
    },

    CallExpression(path) {
      const { node } = path;

      // 检查是否为数组方法调用
      const replacement = handleArrayMethodCall(node, ctx);
      if (replacement) {
        replacements.push({ path, replacement });
      }
    },
  });

  // 批量替换，避免遍历过程中修改 AST
  replacements.forEach(({ path, replacement }) => {
    if (t.isExpression(replacement)) {
      path.replaceWith(replacement);
    } else if (t.isStatement(replacement)) {
      // 对于需要替换为语句的情况（如解构赋值）
      path.replaceWith(replacement);
    }
  });
}

// 检查是否为响应式变量的赋值
function isReactiveAssignment(
  left: t.AssignmentExpression['left'],
  ctx: ScriptTransformContext,
): boolean {
  // 简单标识符赋值: state = value
  if (t.isIdentifier(left)) {
    return ctx.reactiveBindings.some((b) => b.name === left.name);
  }
  if (t.isMemberExpression(left)) {
    const rootObject = getRootObject(left);
    if (t.isIdentifier(rootObject)) {
      return ctx.reactiveBindings.some((b) => b.name === rootObject.name);
    }
  }
  return false;
}

// 检查是否为响应式变量的更新表达式
function isReactiveUpdate(
  argument: t.UpdateExpression['argument'],
  ctx: ScriptTransformContext,
): boolean {
  if (t.isIdentifier(argument)) {
    return ctx.reactiveBindings.some((b) => b.name === argument.name);
  }

  if (t.isMemberExpression(argument)) {
    const rootObject = getRootObject(argument);
    if (t.isIdentifier(rootObject)) {
      return ctx.reactiveBindings.some((b) => b.name === rootObject.name);
    }
  }

  return false;
}

// 处理普通赋值表达式
function handleAssignmentExpression(
  node: t.AssignmentExpression,
  ctx: ScriptTransformContext,
): t.Expression | null {
  const { left, right, operator } = node;

  if (operator !== '=') {
    return handleCompoundAssignment(node, ctx);
  }

  // 1. 简单标识符赋值: state = value -> updateState(value)
  if (t.isIdentifier(left)) {
    const setterName = createSetterName(left.name);
    return t.callExpression(t.identifier(setterName), [right]);
  }

  // 2. 成员表达式赋值: updateState(draft => xxx)
  if (t.isMemberExpression(left)) {
    const rootObject = getRootObject(left);
    if (t.isIdentifier(rootObject)) {
      const setterName = createSetterName(rootObject.name);
      const accessChain = buildAccessChain(left, rootObject.name);

      const draft = t.identifier(rootObject.name);
      const assignment = buildDraftAssignment(draft, accessChain, right);

      const updater = t.arrowFunctionExpression(
        [draft],
        t.blockStatement([t.expressionStatement(assignment)]),
      );

      return t.callExpression(t.identifier(setterName), [updater]);
    }
  }

  return null;
}

// 处理更新表达式 (++, --)
function handleUpdateExpression(
  node: t.UpdateExpression,
  ctx: ScriptTransformContext,
): t.Expression | null {
  const { operator, argument, prefix } = node;

  let rootObject: t.Identifier | null = null;
  let accessChain: t.Expression[] = [];

  if (t.isIdentifier(argument)) {
    rootObject = argument;
  } else if (t.isMemberExpression(argument)) {
    rootObject = getRootObject(argument) as t.Identifier;
    accessChain = buildAccessChain(argument, rootObject.name);
  }

  if (!rootObject || !ctx.reactiveBindings.some((b) => b.name === rootObject.name)) {
    return null;
  }

  const setterName = createSetterName(rootObject.name);

  // 对于简单标识符的更新表达式，使用直接计算
  if (t.isIdentifier(argument)) {
    const updateOperator = operator === '++' ? '+' : '-';
    const newValue = t.binaryExpression(
      updateOperator,
      t.identifier(rootObject.name),
      t.numericLiteral(1),
    );
    return t.callExpression(t.identifier(setterName), [newValue]);
  }

  // 对于成员表达式的更新，使用 updater 函数
  if (t.isMemberExpression(argument)) {
    const accessChain = buildAccessChain(argument, rootObject.name);
    const draft = t.identifier(rootObject.name);

    let target: t.Expression = draft;
    accessChain.forEach((access) => {
      const computed = !t.isIdentifier(access);
      target = t.memberExpression(target, access, computed);
    });

    const updateOperator = operator === '++' ? '+' : '-';
    const updateValue = t.binaryExpression(updateOperator, target, t.numericLiteral(1));

    const assignment = t.assignmentExpression('=', target, updateValue);

    const updater = t.arrowFunctionExpression(
      [draft],
      t.blockStatement([t.expressionStatement(assignment)]),
    );

    return t.callExpression(t.identifier(setterName), [updater]);
  }

  return null;
}

// 处理复合赋值运算符
function handleCompoundAssignment(
  node: t.AssignmentExpression,
  ctx: ScriptTransformContext,
): t.Expression | null {
  const { left, right, operator } = node;

  let rootObject: t.Identifier | null = null;
  let accessChain: t.Expression[] = [];

  if (t.isIdentifier(left)) {
    rootObject = left;
  } else if (t.isMemberExpression(left)) {
    rootObject = getRootObject(left) as t.Identifier;
    accessChain = buildAccessChain(left, rootObject.name);
  }

  if (!rootObject || !ctx.reactiveBindings.some((b) => b.name === rootObject.name)) {
    return null;
  }

  const setterName = createSetterName(rootObject.name);

  // 对于简单标识符的复合赋值，使用直接计算
  if (t.isIdentifier(left)) {
    const compoundOperator = operator.slice(0, -1) as t.BinaryExpression['operator'];
    const newValue = t.binaryExpression(compoundOperator, t.identifier(rootObject.name), right);
    return t.callExpression(t.identifier(setterName), [newValue]);
  }

  // 对于成员表达式的复合赋值，使用 updater 函数
  if (t.isMemberExpression(left)) {
    const accessChain = buildAccessChain(left, rootObject.name);
    const draft = t.identifier(rootObject.name);

    let target: t.Expression = draft;
    accessChain.forEach((access) => {
      const computed = !t.isIdentifier(access);
      target = t.memberExpression(target, access, computed);
    });

    const compoundOperator = operator.slice(0, -1) as t.BinaryExpression['operator'];
    const compoundExpression = t.binaryExpression(compoundOperator, target, right);
    const assignment = t.assignmentExpression('=', target, compoundExpression);

    const updater = t.arrowFunctionExpression(
      [draft],
      t.blockStatement([t.expressionStatement(assignment)]),
    );

    return t.callExpression(t.identifier(setterName), [updater]);
  }

  return null;
}

// 构建成员访问链
function buildAccessChain(memberExpr: t.MemberExpression, rootName: string): t.Expression[] {
  const chain: t.Expression[] = [];
  let current: t.Expression | t.MemberExpression | t.Identifier = memberExpr;

  while (t.isMemberExpression(current)) {
    chain.unshift(current.property as t.Expression);
    current = current.object;
  }

  return chain;
}

// 构建 draft 赋值表达式
function buildDraftAssignment(
  draft: t.Identifier,
  accessChain: t.Expression[],
  value: t.Expression,
): t.AssignmentExpression {
  let target: t.Expression = draft;

  // 构建完整的访问路径
  accessChain.forEach((access, index) => {
    const computed = !t.isIdentifier(access);
    target = t.memberExpression(target, access, computed);
  });

  return t.assignmentExpression('=', target, value);
}

// 处理数组方法调用（push, pop, splice 等）
function handleArrayMethodCall(
  node: t.CallExpression,
  context: ScriptTransformContext,
): t.Expression | null {
  const { callee } = node;

  if (!t.isMemberExpression(callee)) return null;

  const rootObject = getRootObject(callee);
  if (!t.isIdentifier(rootObject)) return null;

  // 检查是否为响应式变量
  if (!context.reactiveBindings.some((b) => b.name === rootObject.name)) {
    return null;
  }

  const { property } = callee;
  if (!t.isIdentifier(property)) return null;

  // 支持的数组变异方法
  const arrayMethods = ['push', 'pop', 'shift', 'unshift', 'splice', 'sort', 'reverse'];
  if (!arrayMethods.includes(property.name)) return null;

  const setterName = createSetterName(rootObject.name);
  const draft = t.identifier(rootObject.name);

  // 构建数组访问路径（排除方法名本身）
  const accessChain = buildAccessChainWithoutMethod(callee);
  let arrayTarget: t.Expression = draft;
  accessChain.forEach((access) => {
    const computed = !t.isIdentifier(access);
    arrayTarget = t.memberExpression(arrayTarget, access, computed);
  });

  // 构建方法调用
  const methodCall = t.callExpression(t.memberExpression(arrayTarget, property), node.arguments);

  const updater = t.arrowFunctionExpression(
    [draft],
    t.blockStatement([t.expressionStatement(methodCall)]),
  );

  return t.callExpression(t.identifier(setterName), [updater]);
}

// 构建访问链（排除最后的方法名）
function buildAccessChainWithoutMethod(memberExpr: t.MemberExpression): t.Expression[] {
  const chain: t.Expression[] = [];
  let current: t.MemberExpression = memberExpr;

  // 遍历到倒数第二个成员（排除方法名）
  while (t.isMemberExpression(current.object)) {
    chain.unshift(current.property as t.Expression);
    current = current.object;
  }

  return chain;
}

function getRootObject(node: t.MemberExpression) {
  let current: t.Expression = node;
  while (t.isMemberExpression(current)) {
    current = current.object;
  }
  return current;
}

// 检查是否为复合赋值
function isCompoundAssignment(node: t.AssignmentExpression): boolean {
  return ['+=', '-=', '*=', '/=', '%=', '**=', '<<=', '>>=', '>>>=', '&=', '^=', '|='].includes(
    node.operator,
  );
}
