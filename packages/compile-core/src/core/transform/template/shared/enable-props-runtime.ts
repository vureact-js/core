import { RuntimeHelperUsageMethods } from '@consts/runtimeHelperUsageMethods';
import { RuntimeModules, RV3_Components, VR_Runtime } from '@consts/runtimeModules';
import { compileContext } from '@shared/compile-context';
import { HelperUsageMethods, RuntimeHelper, RuntimeModuleName } from '@src/types/runtimeHepler';
import { PropsIR, PropTypes } from '../props';
import { isSimpleStyle } from '../props/style';
import { isClassAttr, isStyleAttr } from '../props/utils';

export function enablePropsRuntimeAssistance(propsIR: PropsIR) {
  const rawName = propsIR.rawName;
  const content = propsIR.value.content;

  const restPropValue = (restContent = false) => {
    if (restContent) propsIR.value.content = '';
    propsIR.value.isIdentifier = true;
  };

  // class的值如果是标识符则一律由运行时 vBindCls 处理
  if (isClassAttr(rawName) && propsIR.value.isIdentifier) {
    restPropValue(true);
    setRuntimeHelper(propsIR.runtimeHelper, 'vBindCls');
    return;
  }

  if (isStyleAttr(rawName)) {
    // style的值是非简单对象，一律由运行时 vBindStyle 处理
    if (
      (content && !isSimpleStyle(content)) ||
      propsIR.value.merge?.some((m) => !isSimpleStyle(m))
    ) {
      restPropValue(true);
      setRuntimeHelper(propsIR.runtimeHelper, 'vBindStyle');
    }

    return;
  }

  if (propsIR.type === PropTypes.EVENT) {
    if (propsIR.modifiers?.length) {
      setRuntimeHelper(propsIR.runtimeHelper, 'vOn');
    }

    return;
  }

  if (propsIR.isKeyLessVBind) {
    restPropValue();
    setRuntimeHelper(propsIR.runtimeHelper, 'vBind');
  }
}

export function setRuntimeHelper(
  runtimeHelper: RuntimeHelper['runtimeHelper'],
  name: RuntimeModuleName,
) {
  const moduleMap = getRuntimeModuleByName(name);

  if (!moduleMap) return;

  const { module, onDemand, usage } = moduleMap;

  runtimeHelper.usage = usage;
  runtimeHelper.name = name;
  runtimeHelper.module = module;

  addImport(module, name, onDemand);
}

function addImport(module: RuntimeModules, name: RuntimeModuleName, onDemand: boolean) {
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
