import { RuntimeModules } from '@consts/runtimeModules';
import { compileContext } from '@shared/compile-context';
import { getRuntimeModuleByName } from '@shared/getRuntimeModuleByName';
import { RuntimeHelper, RuntimeModuleName } from '@src/types/runtimeHepler';
import { PropsIR, PropTypes } from './template/props';
import { isSimpleStyle } from './template/props/style';
import { isClassAttr, isStyleAttr } from './template/props/utils';

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
