import { RuntimeModules, RV3_Components, VR_Runtime } from '@consts/runtimeModules';

export interface RuntimeHelper {
  runtimeHelper: {
    usage: HelperUsageMethods;
    name: RuntimeModuleName;
    module: RuntimeModules;
  };
}

export enum HelperUsageMethods {
  COMPONENT_WRAPPER = 1,
  /** replace only same name component. */
  COMPONENT_REPLACEMENT = 2,
  FUNCTION_CALL = 3,
}

export type RuntimeModuleName = keyof typeof VR_Runtime | keyof typeof RV3_Components;
