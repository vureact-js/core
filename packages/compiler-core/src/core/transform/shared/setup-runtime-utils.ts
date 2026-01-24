import { ICompilationContext } from '@compiler/context/types';
import { RuntimeModules } from '@consts/runtimeModules';

export function recordImport(
  ctx: ICompilationContext,
  module: RuntimeModules,
  name: string,
  onDemand: boolean,
) {
  const { imports } = ctx;

  if (imports.has(module)) {
    const list = imports.get(module)!;
    const foundItem = list.find((item) => item.name === name);

    if (!foundItem) {
      list.push({ name, onDemand });
    }

    return;
  }

  imports.set(module, [{ name, onDemand }]);
}
