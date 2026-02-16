import { ICompilationContext } from '@compiler/context/types';

/**
 * 记录需要导入的运行时模块
 */
export function recordImport(ctx: ICompilationContext, pkg: string, name: string, onDemand = true) {
  const { imports } = ctx;

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
