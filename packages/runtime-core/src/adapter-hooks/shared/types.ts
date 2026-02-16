import { type EffectCallback as ReactEffectCallback } from 'react';

export type OnCleanup = (cleanup: Exclude<Destructor, void>) => void;

export type WatchEffectCallback = (onCleanup?: OnCleanup) => Destructor | Promise<Destructor>;

export type EffectCallback = ReactEffectCallback | AsyncCallback | WatchEffectCallback;

export type AsyncCallback = () => Promise<Destructor>;

export type Destructor = void | (() => void);

export type Primitive = null | undefined | string | number | boolean | symbol | bigint;

export type FlushTiming = 'pre' | 'post' | 'sync';
