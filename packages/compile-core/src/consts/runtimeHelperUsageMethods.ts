import { HelperUsageMethods, RuntimeModuleName } from '@src/types/runtimeHepler';

export const RuntimeHelperUsageMethods: Record<RuntimeModuleName, HelperUsageMethods> = {
  // function call
  vOn: HelperUsageMethods.INVOKE,
  vBind: HelperUsageMethods.INVOKE,
  vBindCls: HelperUsageMethods.INVOKE,
  vBindStyle: HelperUsageMethods.INVOKE,

  // component relpcement (replace only same name component)
  KeepAlive: HelperUsageMethods.COMPONENT_REPLACEMENT,
  Suspense: HelperUsageMethods.COMPONENT_REPLACEMENT,
  Transition: HelperUsageMethods.COMPONENT_REPLACEMENT,
  Teleport: HelperUsageMethods.COMPONENT_REPLACEMENT,
  Component: HelperUsageMethods.COMPONENT_REPLACEMENT,
  TransitionGroup: HelperUsageMethods.COMPONENT_REPLACEMENT,
};
