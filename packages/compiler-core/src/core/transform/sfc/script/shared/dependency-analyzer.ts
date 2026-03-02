import { traverse } from '@babel/core';
import { Binding, NodePath } from '@babel/traverse';
import * as t from '@babel/types';
import { ICompilationContext } from '@compiler/context/types';
import { getReactiveStateApis } from '@shared/reactive-utils';
import { findRootIdentifier, getVariableDeclaratorPath, isRealVariableAccess } from './babel-utils';
import { getScriptNodeMeta, setScriptNodeMeta } from './metadata-utils';

// 溯源最大深度，防止循环引用导致死循环
const TRACE_MAX_DEPTH = 20;

/**
 * 分析表达式或语句块中的响应式依赖
 * @param node 要分析的 AST 节点
 * @param parentPath 当前节点的路径，用于确定作用域边界
 */
export function analyzeDeps(
  node: t.Node,
  ctx: ICompilationContext,
  parentPath?: NodePath,
): t.ArrayExpression {
  if (!parentPath) {
    return t.arrayExpression([]);
  }

  const isFnExpr = t.isArrowFunctionExpression(node) || t.isFunctionExpression(node);

  // 确定分析目标：函数表达式则分析其函数体，否则分析节点本身
  const analyzeTarget = isFnExpr ? node.body : node;

  // 确定局部绑定边界：函数表达式则以函数节点为边界，否则以分析目标为边界
  const bindingLocalBoundary = isFnExpr ? node : analyzeTarget;

  const reactiveStateApis = getReactiveStateApis();

  // 使用 Map 存储依赖，Key 为依赖表达式的字符串表示（去重），Value 为 AST 节点
  const deps = new Map<string, t.Expression>();

  // 记录已处理的标识符，避免重复处理（例如 a.b.c 已经处理了 a，就不再单独处理 a）
  const processedIdentifiers = new WeakSet<t.Identifier>();

  function addDependency(exp: t.Expression) {
    deps.set(getDependencyKey(exp), exp);
  }

  // 对分析目标进行遍历
  traverse(
    analyzeTarget,
    {
      'MemberExpression|OptionalMemberExpression'(memberPath) {
        const path = memberPath as NodePath<t.MemberExpression | t.OptionalMemberExpression>;

        // 如果是嵌套成员表达式的对象部分（如 a.b.c 中的 a.b），则跳过，避免重复处理
        if (isNestedMemberObject(path)) return;

        // 获取成员表达式的根标识符（如 a.b.c 中的 a）
        const rootId = findRootIdentifier(path.node);
        if (!rootId) return;

        // 尝试将该成员表达式添加为依赖
        tryAddDependency(path, rootId.name, path.scope);
        // 标记该根标识符已处理，防止后续 Identifier 访问器重复处理
        processedIdentifiers.add(rootId);
      },

      Identifier(idPath) {
        // 跳过已处理的标识符或非真实变量访问
        if (processedIdentifiers.has(idPath.node) || !isRealVariableAccess(idPath)) {
          return;
        }

        tryAddDependency(idPath, idPath.node.name, idPath.scope);
      },
    },
    // 确定作用域范围
    parentPath.scope,
  );

  // 尝试将一个标识符或成员表达式加入依赖列表
  function tryAddDependency(
    depPath: NodePath<t.Expression | t.Identifier>,
    rootName: string,
    scope: NodePath['scope'],
  ) {
    // 格式化依赖表达式（例如将 ref 变量转为 ref.value）
    const normalized = normalizeDependencyExpr(depPath, rootName);
    if (!normalized) return;

    // 查找该变量的定义（Binding）
    const binding = scope.getBinding(rootName);
    if (!binding) return;

    const isLocalBinding = isBindingDeclaredInsideBoundary(binding, bindingLocalBoundary);

    // 检查是否是 props 相关的表达式（例如 props.a, props.b()）
    if (rootName === ctx.propField) {
      // 如果是 props 相关的表达式，直接添加整个表达式作为依赖
      if (!isLocalBinding) {
        addDependency(normalized);
      }
      return;
    }

    //  判断该绑定是否是“合法的依赖源”（来自导入、响应式 API 声明等）
    const directEligible = !isLocalBinding && isEligibleBindingSource(binding);

    if (directEligible) {
      addDependency(normalized);
      return;
    }

    // 如果不直接合格（通常是局部变量），尝试溯源
    const sourcedExpression = traceBindingSource(binding, new Set(), TRACE_MAX_DEPTH);

    if (sourcedExpression) {
      // 如果溯源成功，添加溯源到的原始表达式（例如 'state.value'）
      // 而不是当前的局部变量 'count'
      addDependency(sourcedExpression);
    }
  }

  /**
   * 规范化依赖表达式：
   * 1. 对于标识符，直接返回标识符节点
   * 2. 对于成员表达式，检查是否为有效的依赖表达式：
   *    - 如果是有效的静态成员链（如 state.count），则克隆整个表达式
   *    - 否则只返回根标识符（如对于动态属性访问 obj[prop]，只返回 obj）
   * 3. 其他类型表达式返回 null
   */
  function normalizeDependencyExpr(
    path: NodePath<t.Expression | t.Identifier>,
    rootName: string,
  ): t.Expression | null {
    // 处理标识符：直接返回标识符节点
    if (t.isIdentifier(path.node)) {
      return t.identifier(path.node.name);
    }

    // 处理成员表达式：
    // 1. 如果是有效的响应式依赖表达式（静态成员链），克隆整个表达式
    // 2. 否则只返回根标识符（例如动态属性访问只返回对象本身）
    if (t.isMemberExpression(path.node) || t.isOptionalMemberExpression(path.node)) {
      const normalizedExp = normalizeMemberForCallSite(path, path.node);

      if (isReactValidDependencyExpr(normalizedExp)) {
        return t.cloneNode(normalizedExp, true);
      }

      return t.identifier(rootName);
    }

    return null;
  }

  /**
   * 判断是否为有效的响应式依赖表达式：
   * 1. 标识符是有效的（如 refVar）
   * 2. 成员表达式必须是静态成员链（所有属性访问都是静态的，最终对象是标识符）
   *    例如 state.count、props.value 有效，obj[prop]、obj[getKey()] 无效
   */
  function isReactValidDependencyExpr(node: t.Expression): boolean {
    if (t.isIdentifier(node)) {
      return true;
    }

    if (t.isMemberExpression(node) || t.isOptionalMemberExpression(node)) {
      return isStaticMemberChain(node);
    }

    return false;
  }

  /**
   * 检查是否为静态成员链：从当前节点开始向上遍历对象部分
   * 要求所有层级的属性访问都是静态的（非计算属性或计算属性为字面量）
   * 最终的对象部分必须是标识符
   */
  function isStaticMemberChain(node: t.MemberExpression | t.OptionalMemberExpression): boolean {
    let current: t.Expression | t.Super = node;

    while (t.isMemberExpression(current) || t.isOptionalMemberExpression(current)) {
      // 非计算属性时，属性必须是标识符（例如 obj.prop）
      if (!current.computed && !t.isIdentifier(current.property)) {
        return false;
      }

      // 计算属性时，属性必须是字符串或数字字面量（例如 obj["prop"] 或 obj[0]）
      if (
        current.computed &&
        !t.isStringLiteral(current.property) &&
        !t.isNumericLiteral(current.property)
      ) {
        return false;
      }

      current = current.object;
    }

    // 最终的对象部分必须是标识符（例如 state 或 props）
    return t.isIdentifier(current);
  }

  /**
   * “局部绑定”判定从“同 scope”改为“是否声明在当前分析边界内”。
   */
  function isBindingDeclaredInsideBoundary(binding: Binding, boundary: t.Node): boolean {
    let current: NodePath<t.Node> | null = binding.path as NodePath<t.Node>;

    // 用当前绑定路径的上级父路径节点和边界节点做对比
    while (current) {
      if (current.node === boundary) {
        return true;
      }

      current = current.parentPath as NodePath<t.Node> | null;
    }

    return false;
  }

  /**
   * 对成员调用场景做归一化：
   * 例如 obj.bar.toFixed() 的依赖应为 obj.bar，而不是 obj.bar.toFixed，
   * 否则可能出现依赖值稳定但结果变化的情况。
   */
  function normalizeMemberForCallSite(
    path: NodePath<t.Expression | t.Identifier>,
    node: t.MemberExpression | t.OptionalMemberExpression,
  ): t.Expression {
    const parent = path.parentPath;

    // 检查当前成员表达式是否直接作为调用表达式的 callee（例如 obj.foo() 中的 obj.foo）
    const isDirectCallee =
      !!parent &&
      ((parent.isCallExpression() && parent.node.callee === node) ||
        (parent.isOptionalCallExpression() && parent.node.callee === node));

    // 如果不是直接作为调用表达式的 callee，则返回原始节点（无需归一化）
    if (!isDirectCallee) {
      return node;
    }

    // 确保成员表达式的 object 部分是一个有效的表达式节点
    if (!t.isExpression(node.object)) {
      return node;
    }

    // 对于调用场景，返回 object 部分作为依赖（例如 obj.foo() 的依赖应为 obj，而不是 obj.foo）
    return node.object;
  }

  /**
   * 判断绑定是否合格：
   * 1. 是否是 import 进来的
   * 2. 是否是 reactive/ref 等 API 声明的
   * 3. 是否是函数声明
   */
  function isEligibleBindingSource(binding: Binding): boolean {
    if (binding.kind === 'param') {
      return false;
    }

    const bindingPath = binding.path;
    const declaratorPath = getVariableDeclaratorPath(bindingPath);

    // 判断是否为导入绑定（import 语句引入的变量）
    const isImportBinding =
      bindingPath.isImportSpecifier() ||
      bindingPath.isImportDefaultSpecifier() ||
      bindingPath.isImportNamespaceSpecifier();

    // 判断是否为响应式变量绑定
    const isReactiveVarBinding = !!declaratorPath && isReactiveBinding(declaratorPath.node);
    const nodeInit = declaratorPath?.node.init;

    // 判断是否为响应式 API 调用绑定（如 ref(), reactive() 等）
    const isReactiveApiCallVarBinding =
      !!declaratorPath &&
      t.isCallExpression(nodeInit) &&
      t.isIdentifier(nodeInit.callee) &&
      reactiveStateApis.has(nodeInit.callee.name);

    const isHookCallVarBinding =
      !!declaratorPath && t.isCallExpression(nodeInit) && isHookLikeCallee(nodeInit.callee);

    // 判断是否为函数绑定（函数声明或函数表达式）
    const isFunctionBinding =
      bindingPath.isFunctionDeclaration() ||
      (!!declaratorPath &&
        !!nodeInit &&
        (t.isArrowFunctionExpression(nodeInit) || t.isFunctionExpression(nodeInit)));

    // 如果当前绑定是函数表达式/箭头函数，则将其标记为“未分析依赖”
    // 这样在后续分析中会重新分析该函数的依赖
    if (
      declaratorPath &&
      nodeInit &&
      (t.isArrowFunctionExpression(nodeInit) || t.isFunctionExpression(nodeInit))
    ) {
      markAsAnalyzed(nodeInit, false);
    }

    return (
      isImportBinding ||
      isReactiveVarBinding ||
      isReactiveApiCallVarBinding ||
      isHookCallVarBinding ||
      isFunctionBinding
    );
  }

  /**
   * 判断调用表达式是否为 Hook 类型的调用
   * Hook 通常以 'use' 开头，如 useState、useEffect 等
   * 支持两种形式：
   * 1. 直接调用：useState()
   * 2. 成员调用：React.useState()
   */
  function isHookLikeCallee(callee: t.CallExpression['callee']): boolean {
    // 情况1：直接标识符调用，检查是否以 'use' 开头
    if (t.isIdentifier(callee)) {
      return callee.name.startsWith('use');
    }

    // 情况2：成员表达式调用（如 React.useState）
    // 要求：非计算属性且属性为标识符，同时属性名以 'use' 开头
    if (t.isMemberExpression(callee) && !callee.computed && t.isIdentifier(callee.property)) {
      return callee.property.name.startsWith('use');
    }

    // 其他情况均不视为 Hook 调用
    return false;
  }

  // 递归溯源：检查变量的初始值是否来源于响应式对象
  function traceBindingSource(
    binding: Binding,
    seen: Set<t.Node>,
    depth: number,
  ): t.Expression | null {
    if (depth <= 0) return null;

    const declaratorPath = getVariableDeclaratorPath(binding.path);
    if (!declaratorPath || !declaratorPath.node.init) return null;

    // 防止循环引用
    if (seen.has(declaratorPath.node)) return null;
    seen.add(declaratorPath.node);

    const { init } = declaratorPath.node;

    // 检查初始值表达式（init）是否涉及响应式绑定
    return isExpressionSourcedFromEligibleBinding(init, declaratorPath.scope, seen, depth - 1);
  }

  function isExpressionSourcedFromEligibleBinding(
    exp: t.Expression,
    scope: NodePath['scope'],
    seen: Set<t.Node>,
    depth: number,
  ): t.Expression | null {
    if (depth <= 0) return null;

    // Case 1: 标识符 (例如 c = state)
    if (t.isIdentifier(exp)) {
      const sourceBinding = scope.getBinding(exp.name);
      if (!sourceBinding) return null;

      // 如果源头已经是合格的（例如 import 的 state），直接返回该表达式
      if (isEligibleBindingSource(sourceBinding)) {
        return exp;
      }
      // 否则继续向上递归
      return traceBindingSource(sourceBinding, seen, depth - 1);
    }

    // Case 2: 成员表达式 (例如 c = state.count)
    if (t.isMemberExpression(exp) || t.isOptionalMemberExpression(exp)) {
      const root = findRootIdentifier(exp);
      if (!root) return null;

      const sourceBinding = scope.getBinding(root.name);
      if (!sourceBinding) return null;

      if (isEligibleBindingSource(sourceBinding)) {
        // 【重点】这里返回完整的成员表达式 exp (state.count)
        // 而不仅仅是 root (state)
        // 需要 clone 一份，因为 AST 节点不能多处复用
        return t.cloneNode(exp);
      }

      // 如果 root 本身也是局部变量，继续溯源 root
      // 例如: const a = state; const b = a.count;
      const sourcedRoot = traceBindingSource(sourceBinding, seen, depth - 1);
      if (sourcedRoot) {
        const rebuilt = rebuildMemberWithNewRoot(exp, sourcedRoot);
        if (rebuilt) {
          return rebuilt;
        }

        return t.cloneNode(sourcedRoot, true);
      }
    }

    return null;
  }

  /**
   * 将成员表达式的根标识符替换为新根表达式：
   * a.b.c + state.foo => state.foo.b.c
   */
  function rebuildMemberWithNewRoot(
    node: t.MemberExpression | t.OptionalMemberExpression,
    nextRoot: t.Expression,
  ): t.Expression | null {
    // 替换成员表达式的根对象部分：
    // 1. 如果当前节点的object是标识符，直接用新根节点替换
    // 2. 如果当前节点的object是成员表达式，递归替换其根对象
    const replacedObject = (() => {
      // 标识符情况：直接克隆新根节点作为替换对象
      if (t.isIdentifier(node.object)) {
        return t.cloneNode(nextRoot, true);
      }

      // 嵌套成员表达式情况：递归替换其根对象
      if (t.isMemberExpression(node.object) || t.isOptionalMemberExpression(node.object)) {
        return rebuildMemberWithNewRoot(node.object, nextRoot);
      }

      // 其他类型表达式不支持替换
      return null;
    })();

    // 如果替换对象失败，返回null
    if (!replacedObject) {
      return null;
    }

    // 克隆当前节点的属性部分（保持原属性不变）
    const property = t.cloneNode(node.property, true);

    // 根据节点类型重建成员表达式：
    // 1. 普通成员表达式：使用替换后的对象和原属性构建新节点
    // 2. 可选链表达式：额外保留optional标记
    if (t.isMemberExpression(node)) {
      return t.memberExpression(
        replacedObject,
        property as t.Expression | t.Identifier,
        node.computed,
      );
    }

    return t.optionalMemberExpression(
      replacedObject,
      property as t.Expression | t.Identifier,
      node.computed,
      node.optional,
    );
  }

  // 将收集到的依赖转换为数组表达式并返回
  return t.arrayExpression(Array.from(deps.values()));
}

/**
 * 获取依赖键名
 */
function getDependencyKey(exp: t.Expression): string {
  if (t.isIdentifier(exp)) {
    // 标识符：直接返回其名称作为依赖键
    return exp.name;
  }

  if (t.isMemberExpression(exp) || t.isOptionalMemberExpression(exp)) {
    // 成员表达式或可选链表达式：递归构建对象部分的键，并拼接属性访问部分
    const objectKey = getDependencyKey(exp.object as t.Expression);
    const opt = exp.optional ? '?' : '';

    // 情况1：非计算属性且属性为标识符（例如 obj.prop）
    if (!exp.computed && t.isIdentifier(exp.property)) {
      return `${objectKey}${opt}.${exp.property.name}`;
    }

    // 情况2：计算属性且属性为字符串或数字字面量（例如 obj["prop"] 或 obj[0]）
    if (t.isStringLiteral(exp.property) || t.isNumericLiteral(exp.property)) {
      return `${objectKey}${opt}[${JSON.stringify(exp.property.value)}]`;
    }

    // 情况3：其他计算属性（例如 obj[someVar]），使用通配符表示
    return `${objectKey}${opt}[*]`;
  }

  // 其他类型的表达式：返回其节点类型作为键
  return exp.type;
}

function isNestedMemberObject(
  path: NodePath<t.MemberExpression | t.OptionalMemberExpression>,
): boolean {
  const parent = path.parentPath;
  if (!parent) return false;

  // 判断当前成员表达式是否作为另一个成员表达式的 object 部分（即嵌套成员表达式的内层）
  if (parent.isMemberExpression() || parent.isOptionalMemberExpression()) {
    return parent.node.object === path.node;
  }

  return false;
}

export function isReactiveBinding(node?: t.Node): boolean {
  if (!node) return false;
  return !!getScriptNodeMeta(node)?.is_reactive;
}

export function markAsAnalyzed(node: t.Node, flag = true) {
  const analyzed = getIsAnalyzed(node);
  if (analyzed) return;
  setScriptNodeMeta(node, { is_deps_analyzed: flag });
}

export function getIsAnalyzed(node: t.Node): boolean | undefined {
  return getScriptNodeMeta(node)?.is_deps_analyzed;
}
