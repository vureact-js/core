import { RuntimeModules, RV3_Components, VR_Runtime } from '@consts/runtimeModules';
import { RuntimeModuleName } from '@core/transform/types';

type ModlueMap = Record<string, { onDemand: boolean; module: RuntimeModules }>;

export const getRuntimeModuleByName = (name: RuntimeModuleName) => {
  const map = createModuleMap();
  return map[name];
};

const createModuleMap = () => {
  const map: ModlueMap = {};

  for (const key in VR_Runtime) {
    map[key] = {
      onDemand: true,
      module: RuntimeModules.RUNTIME,
    };
  }
  for (const key in RV3_Components) {
    map[key] = {
      onDemand: true,
      module: RuntimeModules.RV3_COMPONENTS,
    };
  }

  return map;
};
