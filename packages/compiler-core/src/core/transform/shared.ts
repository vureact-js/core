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
