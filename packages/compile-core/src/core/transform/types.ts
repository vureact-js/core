import { RuntimeModules, RV3_Components, VR_Runtime } from '@consts/runtimeModules';

export interface RuntimeHelper {
  runtimeHelper: {
    name: RuntimeModuleName;
    module: RuntimeModules;
  };
}

export type RuntimeModuleName = keyof typeof VR_Runtime | keyof typeof RV3_Components;
