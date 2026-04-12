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
 * 把属性名为 'class' 的属性替换为 'className'
 */
export function resolveClassPropertyToClassName(path: NodePath<t.Node>) {
  const { property } = (path as NodePath<t.MemberExpression | t.OptionalMemberExpression>).node;

  if (!property || (!t.isIdentifier(property) && !t.isStringLiteral(property))) {
    return;
  }

  if (t.isStringLiteral(property) && property.value === 'class') {
    property.value = 'className';
    return;
  }

  if (t.isIdentifier(property) && property.name === 'class') {
    property.name = 'className';
  }
}
