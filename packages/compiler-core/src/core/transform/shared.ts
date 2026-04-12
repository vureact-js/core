import { NodePath } from '@babel/traverse';
import * as t from '@babel/types';
import { ICompilationContext } from '@compiler/context/types';
import { REACT_API_MAP } from '@consts/react-api-map';

/**
 * 记录需要导入的运行时模块
 */
export function recordImport(ctx: ICompilationContext, pkg: string, name: string, onDemand = true) {
  const { imports } = ctx;

  // fix: type-only import
  if (isTypeOnlyImport(name)) {
    name = `type ${name}`;
  }

  if (imports.has(pkg)) {
    const list = imports.get(pkg)!;
    const foundItem = list.find((item) => item.name === name);

    if (!foundItem) {
      list.push({ name, onDemand });
    }

    return;
  }

  imports.set(pkg, [{ name, onDemand }]);
}

// 检查是否为仅类型导入
function isTypeOnlyImport(name: string): boolean {
  const arr: string[] = [REACT_API_MAP.ReactNode];
  return arr.includes(name);
}

/**
 * 把属性/可选属性 [class] 重命名为 [className]
 */
export function resolveClassPropertyToClassName(path: NodePath<t.Node>) {
  const node = (path as NodePath<t.MemberExpression | t.OptionalMemberExpression>).node;
  const { property } = node;

  if (!property || (!t.isIdentifier(property) && !t.isStringLiteral(property))) {
    return;
  }

  const targetName = 'className';
  const parent = path.parentPath?.node;

  // 上下文检查：
  // 如果该成员访问是作为方法调用（例如 `obj.class()` 或 `new Obj.class()`），
  // 则跳过替换，以避免把方法调用误改为 `className()`，
  // 且只有当当前 node 是被调用的 callee 时才跳过替换。
  const isMethod =
    parent &&
    (t.isCallExpression(parent) || t.isOptionalCallExpression(parent) || t.isNewExpression(parent));

  if (isMethod && parent.callee === node) {
    return;
  }

  // obj.class -> obj.className
  if (t.isIdentifier(property) && property.name === 'class') {
    property.name = targetName;
    return;
  }

  // obj['class'] -> obj['className']
  if (t.isStringLiteral(property) && property.value === 'class') {
    property.value = targetName;
  }
}
