import { RuntimeModules } from '@consts/runtimeModules';
import { getRuntimeModuleByName } from '@shared/getRuntimeModuleByName';
import { strCodeTypes } from '@src/shared/getStrCodeBabelType';
import { getContext } from './context';
import { BlockTypes, PropBlock } from './template/props';
import { AttributeBlock } from './template/props/attributes';
import { EventBindinBlock } from './template/props/eventBindings';
import { RuntimeHelper, RuntimeModuleName } from './types';

export function enablePropsRuntimeAssistance(block: PropBlock) {
  if (block.type === BlockTypes.ATTRIBUTE) {
    const attr = block as AttributeBlock;

    if (attr.rawName === 'class') {
      if (
        !strCodeTypes.isSimpleExpression(attr.value.content) ||
        !strCodeTypes.isSimpleExpression(attr.value.toBeMerged as string)
      ) {
        setRuntimeHelper(attr.runtimeHelper, 'vBindCls');
      }
    }

    return;
  }

  if (block.type === BlockTypes.EVENT) {
    const event = block as EventBindinBlock;

    if (event.modifiers?.length) {
      setRuntimeHelper(event.runtimeHelper, 'vOn');
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
