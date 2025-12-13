import { RuntimeModules, RV3_Components, VR_Runtime } from '@consts/runtimeModules';
import { compileContext } from './compile-context';

export function clsRuntime(arg: string, merge?: string): string {
  const fnName = VR_Runtime.vBindCls;
  const fnArgs = [arg, merge].filter(Boolean).join(',');

  recordImport(RuntimeModules.RUNTIME, fnName, true);

  return `${fnName}(${fnArgs})`;
}

export function styleRuntime(target: string, ...merges: string[]): string {
  const fnName = VR_Runtime.vBindStyle;
  const fnArgs = [target, ...merges].filter(Boolean).join(',');

  recordImport(RuntimeModules.RUNTIME, fnName, true);

  return `${fnName}(${fnArgs})`;
}

export function vOnRuntime(event: string, handler: string): string {
  const fnName = VR_Runtime.vOn;
  const fnArgs = [event, handler].filter(Boolean).join(',');

  recordImport(RuntimeModules.RUNTIME, fnName, true);

  return `${fnName}(${fnArgs})`;
}

export function vBindRuntime(strObj: string): string {
  const fnName = VR_Runtime.vBind;
  recordImport(RuntimeModules.RUNTIME, fnName, true);

  return `${fnName}(${strObj})`;
}

export function IsComponent(): keyof typeof RV3_Components {
  const comp = RV3_Components.Component;
  recordImport(RuntimeModules.RV3_COMPONENTS, comp, true);
  return comp as any;
}

function recordImport(module: RuntimeModules, name: string, onDemand: boolean) {
  const { imports } = compileContext.context;

  const foundModule = imports.find((imp) => (imp.module = module));

  if (foundModule) {
    const foundItem = foundModule.items.find((item) => item.name === name);
    if (!foundItem) {
      foundModule.items.push({ name, onDemand });
    }
    return;
  }

  imports.push({
    module,
    items: [{ name, onDemand }],
  });
}
