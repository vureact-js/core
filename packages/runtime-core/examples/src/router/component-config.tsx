import { RouteObject } from 'react-router-dom';
import {
  BasicDynamic,
  BasicKeepAlive,
  BasicProvider,
  BasicSuspense,
  BasicTeleport,
  BasicTransition,
  CustomClassTransition,
  DefaultValueInject,
  DisabledTeleport,
  FactoryInject,
  HooksTransition,
  KeepAliveDynamic,
  LifecycleKeepAlive,
  ListTransition,
  MaxCacheKeepAlive,
  ModeTransition,
  MultipleTeleport,
  NativeTagDynamic,
  NestedSuspense,
  ShuffleTransition,
  SymbolProvider,
  TimeoutSuspense,
} from '../pages/adapter-components';

export const routeConfigForComponents = {
  path: 'components',
  children: [
    {
      path: 'dynamic-component',
      children: [
        { path: 'basic', element: <BasicDynamic /> },
        { path: 'native-tag', element: <NativeTagDynamic /> },
        { path: 'keep-alive', element: <KeepAliveDynamic /> },
      ],
    },
    {
      path: 'keep-alive',
      children: [
        { path: 'basic', element: <BasicKeepAlive /> },
        { path: 'lifecycle', element: <LifecycleKeepAlive /> },
        { path: 'max-cache', element: <MaxCacheKeepAlive /> },
      ],
    },
    {
      path: 'provider',
      children: [
        { path: 'basic', element: <BasicProvider /> },
        { path: 'default-inject', element: <DefaultValueInject /> },
        { path: 'factory-inject', element: <FactoryInject /> },
        { path: 'symbol-key', element: <SymbolProvider /> },
      ],
    },
    {
      path: 'suspense',
      children: [
        { path: 'basic', element: <BasicSuspense /> },
        { path: 'timeout', element: <TimeoutSuspense /> },
        { path: 'nested', element: <NestedSuspense /> },
      ],
    },
    {
      path: 'teleport',
      children: [
        { path: 'basic', element: <BasicTeleport /> },
        { path: 'disabled', element: <DisabledTeleport /> },
        { path: 'multiple', element: <MultipleTeleport /> },
      ],
    },
    {
      path: 'transition',
      children: [
        { path: 'basic', element: <BasicTransition /> },
        { path: 'mode', element: <ModeTransition /> },
        { path: 'custom-class', element: <CustomClassTransition /> },
        { path: 'hooks', element: <HooksTransition /> },
      ],
    },
    {
      path: 'transition-group',
      children: [
        { path: 'list', element: <ListTransition /> },
        { path: 'shuffle', element: <ShuffleTransition /> },
      ],
    },
  ],
} as RouteObject;
