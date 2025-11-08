import { type EffectCallback as ReactEffectCallback } from 'react';

export type EffectCallback = ReactEffectCallback | AsyncCallback;

export type AsyncCallback = () => Promise<Destructor>;

export type Destructor = void | (() => void);
