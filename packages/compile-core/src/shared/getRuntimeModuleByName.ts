import { RuntimeModules, RV3_Components, VR_Runtime } from '@consts/runtimeModules';
import { RuntimeHelperUsageMethods } from '@src/consts/runtimeHelperUsageMethods';
import { HelperUsageMethods, RuntimeModuleName } from '@src/types/runtimeHepler';

type ModlueMap = Record<string, { onDemand: boolean; module: RuntimeModules }>;

export const getRuntimeModuleByName = (
  name: RuntimeModuleName,
): {
  usage: HelperUsageMethods;
  onDemand: boolean;
  module: RuntimeModules;
} => {
  const map = createModuleMap();
  return { ...map[name]!, usage: RuntimeHelperUsageMethods[name] };
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
