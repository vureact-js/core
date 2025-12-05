import { RuntimeModules } from '@consts/runtimeModules';
import { getRuntimeModuleByName } from '@shared/getRuntimeModuleByName';
import { strCodeTypes } from '@src/shared/getStrCodeBabelType';
import { getContext } from './context';
import { PropsIR, PropTypes } from './template/props';
import { isClassAttr } from './template/props/utils';
import { RuntimeHelper, RuntimeModuleName } from './types';

export function enablePropsRuntimeAssistance(propsIR: PropsIR) {
  if (isClassAttr(propsIR.name)) {
    // class的值如果是非静态字符串一律由运行时 vBindCls 处理
    if (
      (propsIR.value.content && !strCodeTypes.isStringLiteral(propsIR.value.content)) ||
      (propsIR.value.combines && !strCodeTypes.isStringLiteral(propsIR.value.combines as string))
    ) {
      propsIR.value.isBabelParseExp = false;
      setRuntimeHelper(propsIR.runtimeHelper, 'vBindCls');
    }
    return;
  }

  if (propsIR.type === PropTypes.EVENT) {
    if (propsIR.modifiers?.length) {
      propsIR.value.isBabelParseExp = false;
      setRuntimeHelper(propsIR.runtimeHelper, 'vOn');
    }

    return;
  }
}

export function setRuntimeHelper(
  runtimeHelper: RuntimeHelper['runtimeHelper'],
  name: RuntimeModuleName,
) {
  const moduleMap = getRuntimeModuleByName(name);

  if (!moduleMap) return;

  const { module, onDemand } = moduleMap;

  runtimeHelper.name = name;
  runtimeHelper.module = module;

  addImport(module, name, onDemand);
}

function addImport(module: RuntimeModules, name: RuntimeModuleName, onDemand: boolean) {
  const { imports } = getContext();

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
