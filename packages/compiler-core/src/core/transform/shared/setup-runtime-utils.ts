import { ICompilationContext } from '@compiler/context/types';
import { RuntimeModules, VuR_Runtime } from '@consts/runtimeModules';

export function clsRuntime(ctx: ICompilationContext, arg: string, merge?: string): string {
  const fnName = VuR_Runtime.vBindCls;
  const fnArgs = [arg, merge].filter(Boolean).join(',');

  recordImport(ctx, RuntimeModules.VUREACT_RUNTIME, fnName, true);

  return `${fnName}(${fnArgs})`;
}

export function styleRuntime(
  ctx: ICompilationContext,
  target: string,
  ...merges: string[]
): string {
  const fnName = VuR_Runtime.vBindStyle;
  const fnArgs = [target, ...merges].filter(Boolean).join(',');

  recordImport(ctx, RuntimeModules.VUREACT_RUNTIME, fnName, true);

  return `${fnName}(${fnArgs})`;
}

export function vOnRuntime(ctx: ICompilationContext, event: string, handler: string): string {
  const fnName = VuR_Runtime.vOn;
  const fnArgs = [event, handler].filter(Boolean).join(',');

  recordImport(ctx, RuntimeModules.VUREACT_RUNTIME, fnName, true);

  return `${fnName}(${fnArgs})`;
}

export function vBindRuntime(ctx: ICompilationContext, strObj: string): string {
  const fnName = VuR_Runtime.vBind;
  recordImport(ctx, RuntimeModules.VUREACT_RUNTIME, fnName, true);

  return `${fnName}(${strObj})`;
}

export function IsComponent(ctx: ICompilationContext): 'Component' {
  const comp = VuR_Runtime.Component;
  recordImport(ctx, RuntimeModules.VUREACT_RUNTIME, comp, true);
  return comp;
}

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
