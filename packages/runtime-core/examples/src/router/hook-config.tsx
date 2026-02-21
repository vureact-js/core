import { RouteObject } from 'react-router-dom';
import {
  ComputedBasic,
  ComputedList,
  ComputedWritable,
  ReactiveBasic,
  ReactiveNested,
  ReadonlyBasic,
  ShallowReactive,
  ShallowReadonly,
  ShallowVRef,
  ToRawBasic,
  ToVRefBasic,
  ToVRefsBasic,
  VRefBasic,
  VRefObject,
  WatchAdvanced,
  WatchBasic,
  WatchEffectBasic,
  WatchEffectFlush,
} from '../pages/adapter-hooks';

export const routeConfigForHooks = {
  path: 'hooks',
  children: [
    {
      path: 'useComputed',
      children: [
        { path: 'basic', element: <ComputedBasic /> },
        { path: 'list', element: <ComputedList /> },
        { path: 'writable', element: <ComputedWritable /> },
      ],
    },
    {
      path: 'useReactive',
      children: [
        { path: 'basic', element: <ReactiveBasic /> },
        { path: 'nested', element: <ReactiveNested /> },
        { path: 'shallow', element: <ShallowReactive /> },
      ],
    },
    {
      path: 'useReadonly',
      children: [
        { path: 'basic', element: <ReadonlyBasic /> },
        { path: 'shallow', element: <ShallowReadonly /> },
      ],
    },
    {
      path: 'useToRaw',
      children: [{ path: 'basic', element: <ToRawBasic /> }],
    },
    {
      path: 'useToVRef',
      children: [{ path: 'basic', element: <ToVRefBasic /> }],
    },
    {
      path: 'useToVRefs',
      children: [{ path: 'basic', element: <ToVRefsBasic /> }],
    },
    {
      path: 'useVRef',
      children: [
        { path: 'basic', element: <VRefBasic /> },
        { path: 'object', element: <VRefObject /> },
        { path: 'shallow', element: <ShallowVRef /> },
      ],
    },
    {
      path: 'useWatch',
      children: [
        { path: 'basic', element: <WatchBasic /> },
        { path: 'advanced', element: <WatchAdvanced /> },
      ],
    },
    {
      path: 'useWatchEffect',
      children: [
        { path: 'basic', element: <WatchEffectBasic /> },
        { path: 'flush', element: <WatchEffectFlush /> },
      ],
    },
  ],
} as RouteObject;
